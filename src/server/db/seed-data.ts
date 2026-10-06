import { inArray, notInArray } from 'drizzle-orm';
import type { PgDatabase, PgQueryResultHKT } from 'drizzle-orm/pg-core';
import type { Dataset } from '../data/dataset';
import { DEFAULT_SETTINGS } from '../repositories/defaults';
import * as schema from './schema';

type AnyPgDatabase = PgDatabase<PgQueryResultHKT, typeof schema>;

/** Inserts the demo dataset. Shared by `npm run db:seed` and the integration tests. */
export async function seedDatabase(db: AnyPgDatabase, data: Dataset) {
  await db.transaction(async (tx) => {
    for (const table of [schema.aiAnalyses, schema.teamMembers, schema.notifications, schema.incidents, schema.deployments, schema.pullRequests, schema.projects, schema.users, schema.workspaceSettings]) {
      await tx.delete(table);
    }
    await tx.insert(schema.users).values(data.members);
    await tx.insert(schema.projects).values(data.projects.map(({ openPullRequests: _o, activeIncidents: _a, slug: _s, ...p }) => p));
    await tx.insert(schema.pullRequests).values(
      data.pullRequests.map((pr) => ({ id: pr.id, projectId: pr.projectId, number: pr.number, title: pr.title, author: pr.author, status: pr.status, riskScore: pr.riskScore, riskLevel: pr.riskLevel, tests: pr.tests, updatedAt: pr.updatedAt, payload: pr })),
    );
    await tx.insert(schema.deployments).values(
      data.deployments.map((d) => ({ id: d.id, projectId: d.projectId, number: d.number, status: d.status, environment: d.environment, commitSha: d.commitSha, commitMessage: d.commitMessage, author: d.author, durationSeconds: d.durationSeconds, startedAt: d.startedAt, payload: d })),
    );
    await tx.insert(schema.incidents).values(
      data.incidents.map((i) => ({ id: i.id, projectId: i.projectId, title: i.title, severity: i.severity, status: i.status, service: i.service, assignee: i.assignee, createdAt: i.createdAt, payload: i })),
    );
    await tx.insert(schema.teamMembers).values(
      data.projects.flatMap((p) => data.members.filter((m) => m.status === 'active').map((m) => ({ projectId: p.id, userId: m.id, role: m.role }))),
    );
    await tx.insert(schema.notifications).values(data.notifications.map((n) => ({ ...n, severity: n.severity ?? null, read: n.read ? 1 : 0 })));
    await tx.insert(schema.workspaceSettings).values({ id: 'default', value: DEFAULT_SETTINGS });
  });
}

/**
 * Daily demo refresh that keeps user-created projects: every project that is
 * not part of the demo dataset survives with its pull requests, deployments,
 * incidents, members and AI analyses; everything else is reseeded. Runs in one
 * transaction (the reseed nests as a savepoint), so readers never see a gap.
 */
export async function refreshDemoData(db: AnyPgDatabase, data: Dataset) {
  const demoIds = data.projects.map((p) => p.id);
  await db.transaction(async (tx) => {
    const keep = await tx.select().from(schema.projects).where(notInArray(schema.projects.id, demoIds));
    const keepIds = keep.map((p) => p.id);
    const [prs, deploys, incs, members, analyses] = keepIds.length
      ? await Promise.all([
          tx.select().from(schema.pullRequests).where(inArray(schema.pullRequests.projectId, keepIds)),
          tx.select().from(schema.deployments).where(inArray(schema.deployments.projectId, keepIds)),
          tx.select().from(schema.incidents).where(inArray(schema.incidents.projectId, keepIds)),
          tx.select().from(schema.teamMembers).where(inArray(schema.teamMembers.projectId, keepIds)),
          tx.select().from(schema.aiAnalyses),
        ])
      : [[], [], [], [], []];

    await seedDatabase(tx, data);
    if (!keepIds.length) return;

    const users = new Set(data.members.map((m) => m.id));
    const targets = new Set([...prs, ...deploys, ...incs].map((r) => r.id));
    await tx.insert(schema.projects).values(keep.map((p) => ({ ...p, ownerId: p.ownerId && users.has(p.ownerId) ? p.ownerId : null })));
    if (prs.length) await tx.insert(schema.pullRequests).values(prs);
    if (deploys.length) await tx.insert(schema.deployments).values(deploys);
    if (incs.length) await tx.insert(schema.incidents).values(incs);
    const keptMembers = members.filter((m) => users.has(m.userId));
    if (keptMembers.length) await tx.insert(schema.teamMembers).values(keptMembers);
    const keptAnalyses = analyses.filter((a) => targets.has(a.targetId));
    if (keptAnalyses.length) await tx.insert(schema.aiAnalyses).values(keptAnalyses);
  });
}
