import type { AIAnalysisEnvelope, AIAnalysisKind } from '@/schemas/ai';
import type { WorkspaceSettings } from '@/schemas/settings';
import type {
  Deployment,
  DeploymentSummary,
  Incident,
  IncidentSummary,
  Project,
  PullRequest,
  PullRequestSummary,
  TeamMember,
} from '@/types/domain';
import { computeDashboardMetrics, computeDeploymentSeries, computePerformanceSeries } from '../data/analytics';
import { createDataset, projectServices, type Dataset } from '../data/dataset';
import { activityFromDataset, searchDataset } from '../data/projections';
import { inSet, matchesText, paginate, sortBy } from '../data/query';
import { DEFAULT_SETTINGS } from './defaults';
import type { Repository } from './types';

interface Store extends Dataset {
  settings: WorkspaceSettings;
  analyses: Map<string, AIAnalysisEnvelope<AIAnalysisKind>>;
  createdAt: number;
}

// Survive dev-server HMR and share state across route handlers in one process.
const globalStore = globalThis as unknown as { __aiwStore?: Store };

function store(): Store {
  if (!globalStore.__aiwStore) {
    const now = Date.now();
    globalStore.__aiwStore = { ...createDataset(now), settings: structuredClone(DEFAULT_SETTINGS), analyses: new Map(), createdAt: now };
  }
  return globalStore.__aiwStore;
}

/** Test helper: reset to a pristine dataset. */
export function resetMemoryStore(now = Date.now()) {
  globalStore.__aiwStore = { ...createDataset(now), settings: structuredClone(DEFAULT_SETTINGS), analyses: new Map(), createdAt: now };
}

const clone = <T>(value: T): T => structuredClone(value);

function toPullRequestSummary(pr: PullRequest): PullRequestSummary {
  const { description: _d, reviewers: _r, commits: _c, files: _f, checks: _ch, comments: _co, ...summary } = pr;
  return summary;
}

function toDeploymentSummary(d: Deployment): DeploymentSummary {
  const { url: _u, stages: _s, logs: _l, changedFiles: _c, performance: _p, ...summary } = d;
  return summary;
}

function toIncidentSummary(i: Incident): IncidentSummary {
  const { description: _d, relatedDeploymentId: _r, timeline: _t, ...summary } = i;
  return summary;
}

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function recomputeProjectCounters(s: Store, projectId: string) {
  const project = s.projects.find((p) => p.id === projectId);
  if (!project) return;
  project.activeIncidents = s.incidents.filter((i) => i.projectId === projectId && i.status !== 'resolved').length;
  project.openPullRequests = s.pullRequests.filter((p) => p.projectId === projectId && (p.status === 'open' || p.status === 'draft')).length;
}

export function createMemoryRepository(): Repository {
  return {
    projects: {
      async list(filter) {
        return clone(store().projects.filter((p) => matchesText(filter?.q, p.name, p.repository, p.description)));
      },
      async get(id) {
        const project = store().projects.find((p) => p.id === id);
        return project ? clone(project) : null;
      },
      async create(input, ownerId) {
        const s = store();
        let id = slugify(input.name);
        if (s.projects.some((p) => p.id === id)) id = `${id}-${s.projects.length + 1}`;
        const project: Project = {
          id,
          slug: id,
          name: input.name,
          description: input.description ?? '',
          repository: input.repository,
          defaultBranch: input.defaultBranch,
          status: 'active',
          deploymentStatus: 'queued',
          openPullRequests: 0,
          activeIncidents: 0,
          healthScore: 100,
          lastDeploymentAt: null,
          language: input.language,
          tags: [],
          ownerId,
          createdAt: new Date().toISOString(),
        };
        s.projects.unshift(project);
        return clone(project);
      },
      async update(id, input) {
        const project = store().projects.find((p) => p.id === id);
        if (!project) return null;
        Object.assign(project, {
          name: input.name,
          repository: input.repository,
          defaultBranch: input.defaultBranch,
          description: input.description ?? '',
          language: input.language,
          status: input.status,
          tags: input.tags,
        });
        return clone(project);
      },
    },

    pullRequests: {
      async list(query) {
        const items = store()
          .pullRequests.filter((pr) => !query.projectId || pr.projectId === query.projectId)
          .filter((pr) => inSet(query.status, pr.status) && inSet(query.risk, pr.riskLevel))
          .filter((pr) => matchesText(query.q, pr.title, pr.author, pr.number, pr.branch));
        const sorted = sortBy(
          items,
          query.sort,
          {
            number: (pr) => pr.number,
            title: (pr) => pr.title,
            author: (pr) => pr.author,
            status: (pr) => pr.status,
            files: (pr) => pr.filesChanged,
            changes: (pr) => pr.additions + pr.deletions,
            tests: (pr) => pr.tests.failed,
            risk: (pr) => pr.riskScore,
            updated: (pr) => pr.updatedAt,
          },
          'updated.desc',
        );
        return clone(paginate(sorted.map(toPullRequestSummary), query.page, query.pageSize));
      },
      async get(projectId, number) {
        const pr = store().pullRequests.find((p) => p.projectId === projectId && p.number === number);
        return pr ? clone(pr) : null;
      },
    },

    deployments: {
      async list(query) {
        const items = store()
          .deployments.filter((d) => !query.projectId || d.projectId === query.projectId)
          .filter((d) => inSet(query.status, d.status) && inSet(query.environment, d.environment))
          .filter((d) => matchesText(query.q, d.commitMessage, d.commitSha, d.author, d.branch, d.number));
        const sorted = sortBy(
          items,
          query.sort,
          {
            number: (d) => d.number,
            status: (d) => d.status,
            environment: (d) => d.environment,
            author: (d) => d.author,
            duration: (d) => d.durationSeconds,
            started: (d) => d.startedAt,
          },
          'started.desc',
        );
        return clone(paginate(sorted.map(toDeploymentSummary), query.page, query.pageSize));
      },
      async get(projectId, number) {
        const d = store().deployments.find((x) => x.projectId === projectId && x.number === number);
        return d ? clone(d) : null;
      },
      async getById(id) {
        const d = store().deployments.find((x) => x.id === id);
        return d ? clone(d) : null;
      },
    },

    incidents: {
      async list(query) {
        const items = store()
          .incidents.filter((i) => !query.projectId || i.projectId === query.projectId)
          .filter((i) => inSet(query.severity, i.severity) && inSet(query.status, i.status))
          .filter((i) => query.service.length === 0 || query.service.includes(i.service))
          .filter((i) => query.assignee.length === 0 || (i.assignee !== null && query.assignee.includes(i.assignee)))
          .filter((i) => matchesText(query.q, i.title, i.reference, i.service));
        const sorted = sortBy(
          items,
          query.sort,
          {
            reference: (i) => i.reference,
            title: (i) => i.title,
            severity: (i) => i.severity,
            status: (i) => i.status,
            service: (i) => i.service,
            affected: (i) => i.affectedUsers,
            created: (i) => i.createdAt,
          },
          'created.desc',
        );
        return clone(paginate(sorted.map(toIncidentSummary), query.page, query.pageSize));
      },
      async facets(projectId) {
        const s = store();
        const incidents = s.incidents.filter((i) => !projectId || i.projectId === projectId);
        const services = new Set(incidents.map((i) => i.service));
        (projectId ? projectServices(projectId) : s.projects.flatMap((p) => projectServices(p.id))).forEach((svc) => services.add(svc));
        const assignees = new Set(incidents.map((i) => i.assignee).filter((a): a is string => a !== null));
        return { services: [...services].sort(), assignees: [...assignees].sort() };
      },
      async get(id) {
        const incident = store().incidents.find((i) => i.id === id);
        return incident ? clone(incident) : null;
      },
      async create(input, actor) {
        const s = store();
        const next = Math.max(...s.incidents.map((i) => Number(i.id.split('-')[1]) || 0)) + 1;
        const now = new Date().toISOString();
        const deployment = input.relatedDeploymentId ? s.deployments.find((d) => d.id === input.relatedDeploymentId) : undefined;
        const incident: Incident = {
          id: `inc-${next}`,
          reference: `INC-${next}`,
          projectId: input.projectId,
          title: input.title,
          description: input.description,
          severity: input.severity,
          status: 'investigating',
          service: input.service,
          assignee: input.assignee,
          affectedUsers: 0,
          createdAt: now,
          resolvedAt: null,
          relatedDeploymentId: deployment?.id ?? null,
          timeline: [
            ...(deployment
              ? [{ id: `inc-${next}-e0`, type: 'deployment' as const, title: `Deployment #${deployment.number}`, description: deployment.commitMessage, occurredAt: deployment.startedAt, actor: deployment.author, href: `/projects/${deployment.projectId}/deployments/${deployment.number}` }]
              : []),
            { id: `inc-${next}-e1`, type: 'created', title: 'Incident opened', description: `Declared manually by ${actor}.`, occurredAt: now, actor },
          ],
        };
        s.incidents.unshift(incident);
        recomputeProjectCounters(s, input.projectId);
        s.notifications.unshift({ id: `ntf-${Date.now()}`, kind: 'incident', title: `${input.severity.toUpperCase()} · ${incident.reference} opened`, body: incident.title, href: `/projects/${incident.projectId}/incidents/${incident.id}`, createdAt: now, read: false });
        return clone(incident);
      },
      async update(id, input, actor) {
        const s = store();
        const incident = s.incidents.find((i) => i.id === id);
        if (!incident) return null;
        const now = new Date().toISOString();
        const typeByStatus = { investigating: 'investigation', identified: 'investigation', monitoring: 'mitigation', resolved: 'resolution' } as const;
        if (incident.status !== input.status) {
          incident.status = input.status;
          incident.resolvedAt = input.status === 'resolved' ? now : null;
          incident.timeline.push({ id: `${id}-e${incident.timeline.length + 1}`, type: typeByStatus[input.status], title: `Status changed to ${input.status}`, description: input.note || `Updated by ${actor}.`, occurredAt: now, actor });
        } else if (input.note) {
          incident.timeline.push({ id: `${id}-e${incident.timeline.length + 1}`, type: 'note', title: 'Note added', description: input.note, occurredAt: now, actor });
        }
        recomputeProjectCounters(s, incident.projectId);
        return clone(incident);
      },
    },

    team: {
      async list() {
        return clone(store().members);
      },
      async get(id) {
        const m = store().members.find((x) => x.id === id);
        return m ? clone(m) : null;
      },
      async invite(input) {
        const s = store();
        if (s.members.some((m) => m.email.toLowerCase() === input.email.toLowerCase())) {
          throw new Error('A member with this email already exists');
        }
        const member: TeamMember = {
          id: `usr_${Date.now().toString(36)}`,
          name: input.name,
          email: input.email,
          role: input.role,
          title: '',
          status: 'invited',
          presence: 'offline',
          lastActiveAt: new Date().toISOString(),
        };
        s.members.push(member);
        return clone(member);
      },
      async updateRole(id, role) {
        const m = store().members.find((x) => x.id === id);
        if (!m) return null;
        m.role = role;
        return clone(m);
      },
      async updateAccount(id, input) {
        const m = store().members.find((x) => x.id === id);
        if (!m) return null;
        Object.assign(m, input);
        return clone(m);
      },
      async remove(id) {
        const s = store();
        const before = s.members.length;
        s.members = s.members.filter((m) => m.id !== id);
        return s.members.length < before;
      },
    },

    notifications: {
      async list() {
        return clone(store().notifications);
      },
      async markRead(ids) {
        const s = store();
        s.notifications.forEach((n) => {
          if (ids === 'all' || ids.includes(n.id)) n.read = true;
        });
        return clone(s.notifications);
      },
    },

    analytics: {
      async metrics(query) {
        return computeDashboardMetrics(store(), query);
      },
      async deploymentSeries(query) {
        return computeDeploymentSeries(store(), query);
      },
      async performanceSeries(query) {
        return computePerformanceSeries(store(), query);
      },
      async activity(filter) {
        return activityFromDataset(store(), filter);
      },
    },

    async search(q) {
      return searchDataset(store(), q);
    },

    settings: {
      async get() {
        return clone(store().settings);
      },
      async update(section, value) {
        const s = store();
        s.settings = { ...s.settings, [section]: clone(value) };
        return clone(s.settings);
      },
    },

    aiAnalyses: {
      async latest<K extends AIAnalysisKind>(kind: K, targetId: string) {
        const found = store().analyses.get(`${kind}:${targetId}`);
        return found ? (clone(found) as AIAnalysisEnvelope<K>) : null;
      },
      async save(envelope) {
        store().analyses.set(`${envelope.kind}:${envelope.targetId}`, clone(envelope) as AIAnalysisEnvelope<AIAnalysisKind>);
      },
    },
  };
}
