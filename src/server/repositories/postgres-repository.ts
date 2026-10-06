import 'server-only';
import { and, asc, count, desc, eq, ilike, inArray, or, sql, type AnyColumn, type SQL } from 'drizzle-orm';
import type { AIAnalysisEnvelope, AIAnalysisKind } from '@/schemas/ai';
import type { Deployment, Incident, Notification, Paginated, Project, PullRequest, TeamMember } from '@/types/domain';
import { computeDashboardMetrics, computeDeploymentSeries, computePerformanceSeries } from '../data/analytics';
import type { Dataset } from '../data/dataset';
import { activityFromDataset, searchDataset } from '../data/projections';
import { getDb, type Database } from '../db/client';
import * as t from '../db/schema';
import { DEFAULT_SETTINGS } from './defaults';
import type { Repository } from './types';

/**
 * PostgreSQL implementation of the Repository contract (Drizzle ORM).
 * Enabled with DATA_SOURCE=postgres. Filtering, sorting and pagination run in
 * SQL; aggregate payloads are read from JSONB.
 */

function orderFor(sort: string | undefined, columns: Record<string, AnyColumn>, fallback: string): SQL {
  const [field, dir] = (sort ?? fallback).split('.');
  const column = columns[field ?? ''] ?? columns[fallback.split('.')[0]!]!;
  return dir === 'asc' ? asc(column) : desc(column);
}

async function page<T>(db: Database, table: typeof t.pullRequests | typeof t.deployments | typeof t.incidents, where: SQL | undefined, order: SQL, pageNumber: number, pageSize: number, map: (row: { payload: unknown }) => T): Promise<Paginated<T>> {
  const [{ total } = { total: 0 }] = await db.select({ total: count() }).from(table).where(where);
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const current = Math.min(pageNumber, pageCount);
  const rows = await db.select({ payload: table.payload }).from(table).where(where).orderBy(order).limit(pageSize).offset((current - 1) * pageSize);
  return { items: rows.map(map), total, page: current, pageSize, pageCount };
}

function withCounters(project: typeof t.projects.$inferSelect, open: number, active: number): Project {
  return { ...project, slug: project.id, ownerId: project.ownerId ?? '', openPullRequests: open, activeIncidents: active };
}

export function createPostgresRepository(db: Database = getDb()): Repository {
  // Search & analytics need the whole (small) graph; reuse the pure functions.
  const loadDataset = async (): Promise<Dataset> => {
    const [projects, prs, deploys, incs, members] = await Promise.all([
      repo.projects.list(),
      db.select({ payload: t.pullRequests.payload }).from(t.pullRequests),
      db.select({ payload: t.deployments.payload }).from(t.deployments),
      db.select({ payload: t.incidents.payload }).from(t.incidents),
      repo.team.list(),
    ]);
    return { projects, pullRequests: prs.map((r) => r.payload), deployments: deploys.map((r) => r.payload), incidents: incs.map((r) => r.payload), members, notifications: [] };
  };

  const repo: Repository = {
    projects: {
      async list(filter) {
        const where = filter?.q ? or(ilike(t.projects.name, `%${filter.q}%`), ilike(t.projects.repository, `%${filter.q}%`)) : undefined;
        const rows = await db.select().from(t.projects).where(where).orderBy(asc(t.projects.name));
        const open = await db.select({ projectId: t.pullRequests.projectId, n: count() }).from(t.pullRequests).where(inArray(t.pullRequests.status, ['open', 'draft'])).groupBy(t.pullRequests.projectId);
        const active = await db.select({ projectId: t.incidents.projectId, n: count() }).from(t.incidents).where(sql`${t.incidents.status} <> 'resolved'`).groupBy(t.incidents.projectId);
        const lookup = (xs: { projectId: string; n: number }[], id: string) => xs.find((x) => x.projectId === id)?.n ?? 0;
        return rows.map((p) => withCounters(p, lookup(open, p.id), lookup(active, p.id)));
      },
      async get(id) {
        return (await repo.projects.list()).find((p) => p.id === id) ?? null;
      },
      async create(input, ownerId) {
        const id = input.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        const [row] = await db
          .insert(t.projects)
          .values({ id, name: input.name, repository: input.repository, defaultBranch: input.defaultBranch, description: input.description ?? '', language: input.language, status: 'active', deploymentStatus: 'queued', healthScore: 100, ownerId })
          .returning();
        return withCounters(row!, 0, 0);
      },
      async update(id, input) {
        const [row] = await db.update(t.projects).set({ ...input, description: input.description ?? '' }).where(eq(t.projects.id, id)).returning();
        return row ? repo.projects.get(id) : null;
      },
    },

    pullRequests: {
      async list(q) {
        const where = and(
          q.projectId ? eq(t.pullRequests.projectId, q.projectId) : undefined,
          q.status.length ? inArray(t.pullRequests.status, q.status) : undefined,
          q.risk.length ? inArray(t.pullRequests.riskLevel, q.risk) : undefined,
          q.q ? or(ilike(t.pullRequests.title, `%${q.q}%`), ilike(t.pullRequests.author, `%${q.q}%`)) : undefined,
        );
        const order = orderFor(q.sort, { number: t.pullRequests.number, title: t.pullRequests.title, author: t.pullRequests.author, status: t.pullRequests.status, risk: t.pullRequests.riskScore, updated: t.pullRequests.updatedAt }, 'updated.desc');
        return page(db, t.pullRequests, where, order, q.page, q.pageSize, (r) => {
          const { description: _d, reviewers: _r, commits: _c, files: _f, checks: _ch, comments: _co, ...summary } = r.payload as PullRequest;
          return summary;
        });
      },
      async get(projectId, number) {
        const [row] = await db.select({ payload: t.pullRequests.payload }).from(t.pullRequests).where(and(eq(t.pullRequests.projectId, projectId), eq(t.pullRequests.number, number)));
        return row?.payload ?? null;
      },
    },

    deployments: {
      async list(q) {
        const where = and(
          q.projectId ? eq(t.deployments.projectId, q.projectId) : undefined,
          q.status.length ? inArray(t.deployments.status, q.status) : undefined,
          q.environment.length ? inArray(t.deployments.environment, q.environment) : undefined,
          q.q ? or(ilike(t.deployments.commitMessage, `%${q.q}%`), ilike(t.deployments.commitSha, `%${q.q}%`), ilike(t.deployments.author, `%${q.q}%`)) : undefined,
        );
        const order = orderFor(q.sort, { number: t.deployments.number, status: t.deployments.status, environment: t.deployments.environment, author: t.deployments.author, duration: t.deployments.durationSeconds, started: t.deployments.startedAt }, 'started.desc');
        return page(db, t.deployments, where, order, q.page, q.pageSize, (r) => {
          const { url: _u, stages: _s, logs: _l, changedFiles: _c, performance: _p, ...summary } = r.payload as Deployment;
          return summary;
        });
      },
      async get(projectId, number) {
        const [row] = await db.select({ payload: t.deployments.payload }).from(t.deployments).where(and(eq(t.deployments.projectId, projectId), eq(t.deployments.number, number)));
        return row?.payload ?? null;
      },
      async getById(id) {
        const [row] = await db.select({ payload: t.deployments.payload }).from(t.deployments).where(eq(t.deployments.id, id));
        return row?.payload ?? null;
      },
    },

    incidents: {
      async list(q) {
        const where = and(
          q.projectId ? eq(t.incidents.projectId, q.projectId) : undefined,
          q.severity.length ? inArray(t.incidents.severity, q.severity) : undefined,
          q.status.length ? inArray(t.incidents.status, q.status) : undefined,
          q.service.length ? inArray(t.incidents.service, q.service) : undefined,
          q.assignee.length ? inArray(t.incidents.assignee, q.assignee) : undefined,
          q.q ? or(ilike(t.incidents.title, `%${q.q}%`), ilike(t.incidents.service, `%${q.q}%`)) : undefined,
        );
        const order = orderFor(q.sort, { title: t.incidents.title, severity: t.incidents.severity, status: t.incidents.status, service: t.incidents.service, created: t.incidents.createdAt }, 'created.desc');
        return page(db, t.incidents, where, order, q.page, q.pageSize, (r) => {
          const { description: _d, relatedDeploymentId: _r, timeline: _t, ...summary } = r.payload as Incident;
          return summary;
        });
      },
      async facets(projectId) {
        const rows = await db.selectDistinct({ service: t.incidents.service, assignee: t.incidents.assignee }).from(t.incidents).where(projectId ? eq(t.incidents.projectId, projectId) : undefined);
        return {
          services: [...new Set(rows.map((r) => r.service))].sort(),
          assignees: [...new Set(rows.map((r) => r.assignee).filter((a): a is string => !!a))].sort(),
        };
      },
      async get(id) {
        const [row] = await db.select({ payload: t.incidents.payload }).from(t.incidents).where(eq(t.incidents.id, id));
        return row?.payload ?? null;
      },
      async create(input, actor) {
        const [{ n } = { n: 0 }] = await db.select({ n: count() }).from(t.incidents);
        const id = `inc-${100 + n}`;
        const now = new Date().toISOString();
        const incident: Incident = { ...input, id, reference: id.toUpperCase(), status: 'investigating', affectedUsers: 0, createdAt: now, resolvedAt: null, timeline: [{ id: `${id}-e1`, type: 'created', title: 'Incident opened', description: `Declared manually by ${actor}.`, occurredAt: now, actor }] };
        await db.insert(t.incidents).values({ id, projectId: input.projectId, title: input.title, severity: input.severity, status: 'investigating', service: input.service, assignee: input.assignee, createdAt: now, payload: incident });
        return incident;
      },
      async update(id, input, actor) {
        const incident = await repo.incidents.get(id);
        if (!incident) return null;
        const now = new Date().toISOString();
        incident.status = input.status;
        incident.resolvedAt = input.status === 'resolved' ? now : null;
        incident.timeline.push({ id: `${id}-e${incident.timeline.length + 1}`, type: input.status === 'resolved' ? 'resolution' : 'note', title: `Status changed to ${input.status}`, description: input.note || `Updated by ${actor}.`, occurredAt: now, actor });
        await db.update(t.incidents).set({ status: input.status, payload: incident }).where(eq(t.incidents.id, id));
        return incident;
      },
    },

    team: {
      async list() {
        return (await db.select().from(t.users).orderBy(asc(t.users.name))) as TeamMember[];
      },
      async get(id) {
        const [row] = await db.select().from(t.users).where(eq(t.users.id, id));
        return (row as TeamMember | undefined) ?? null;
      },
      async invite(input) {
        const [row] = await db
          .insert(t.users)
          .values({ id: `usr_${Date.now().toString(36)}`, name: input.name, email: input.email, role: input.role, status: 'invited', presence: 'offline', lastActiveAt: new Date().toISOString() })
          .returning();
        return row as TeamMember;
      },
      async updateRole(id, role) {
        const [row] = await db.update(t.users).set({ role }).where(eq(t.users.id, id)).returning();
        return (row as TeamMember | undefined) ?? null;
      },
      async updateAccount(id, input) {
        const [row] = await db.update(t.users).set(input).where(eq(t.users.id, id)).returning();
        return (row as TeamMember | undefined) ?? null;
      },
      async remove(id) {
        const rows = await db.delete(t.users).where(eq(t.users.id, id)).returning({ id: t.users.id });
        return rows.length > 0;
      },
    },

    notifications: {
      async list() {
        const rows = await db.select().from(t.notifications).orderBy(desc(t.notifications.createdAt));
        return rows.map((r): Notification => ({ ...r, read: r.read === 1 }));
      },
      async markRead(ids) {
        await db.update(t.notifications).set({ read: 1 }).where(ids === 'all' ? undefined : inArray(t.notifications.id, ids));
        return repo.notifications.list();
      },
    },

    analytics: {
      async metrics(q) {
        return computeDashboardMetrics(await loadDataset(), q);
      },
      async deploymentSeries(q) {
        return computeDeploymentSeries(await loadDataset(), q);
      },
      async performanceSeries(q) {
        return computePerformanceSeries(await loadDataset(), q);
      },
      async activity(filter) {
        return activityFromDataset(await loadDataset(), filter);
      },
    },

    async search(q) {
      return searchDataset(await loadDataset(), q);
    },

    settings: {
      async get() {
        const [row] = await db.select().from(t.workspaceSettings).where(eq(t.workspaceSettings.id, 'default'));
        return row?.value ?? structuredClone(DEFAULT_SETTINGS);
      },
      async update(section, value) {
        const next = { ...(await repo.settings.get()), [section]: value };
        await db.insert(t.workspaceSettings).values({ id: 'default', value: next }).onConflictDoUpdate({ target: t.workspaceSettings.id, set: { value: next } });
        return next;
      },
    },

    aiAnalyses: {
      async latest<K extends AIAnalysisKind>(kind: K, targetId: string) {
        const [row] = await db.select().from(t.aiAnalyses).where(and(eq(t.aiAnalyses.kind, kind), eq(t.aiAnalyses.targetId, targetId))).orderBy(desc(t.aiAnalyses.createdAt)).limit(1);
        return row ? ({ ...row, result: row.result } as AIAnalysisEnvelope<K>) : null;
      },
      async save(envelope) {
        await db.insert(t.aiAnalyses).values(envelope);
      },
    },
  };

  return repo;
}
