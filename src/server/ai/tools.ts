import type { AIContext, SourceRef } from '@/schemas/ai';
import type { Repository } from '../repositories';
import type { ToolDefinition } from './openai-client';

/**
 * Tools exposed to the assistant. The live LLM calls them through function
 * calling; the demo model calls them directly after intent detection. Each
 * tool returns compact JSON for the model plus `sources` for UI citations.
 */

export interface ToolResult {
  data: unknown;
  sources: SourceRef[];
}

type ToolArgs = Record<string, unknown>;

interface Tool {
  definition: ToolDefinition;
  run(repo: Repository, args: ToolArgs): Promise<ToolResult>;
}

const str = (v: unknown) => (typeof v === 'string' && v.length > 0 ? v : undefined);

export const TOOLS: Record<string, Tool> = {
  list_incidents: {
    definition: {
      type: 'function',
      function: {
        name: 'list_incidents',
        description: 'List incidents, newest first. Use for questions about outages, incidents or what is broken.',
        parameters: { type: 'object', properties: { projectId: { type: 'string' }, activeOnly: { type: 'boolean' } }, additionalProperties: false },
      },
    },
    async run(repo, args) {
      const page = await repo.incidents.list({ projectId: str(args.projectId), severity: [], status: args.activeOnly ? ['investigating', 'identified', 'monitoring'] : [], service: [], assignee: [], page: 1, pageSize: 8 });
      const full = await Promise.all(page.items.map((i) => repo.incidents.get(i.id)));
      return {
        data: full.filter(Boolean).map((i) => ({ id: i!.id, ref: i!.reference, title: i!.title, severity: i!.severity, status: i!.status, service: i!.service, createdAt: i!.createdAt, relatedDeploymentId: i!.relatedDeploymentId, projectId: i!.projectId })),
        sources: page.items.map((i) => ({ type: 'incident', id: i.id, label: `${i.reference} · ${i.title}`, href: `/projects/${i.projectId}/incidents/${i.id}` })),
      };
    },
  },
  list_deployments: {
    definition: {
      type: 'function',
      function: {
        name: 'list_deployments',
        description: 'List recent deployments, newest first. Filter by status (e.g. failed) and project.',
        parameters: { type: 'object', properties: { projectId: { type: 'string' }, status: { type: 'string', enum: ['success', 'failed', 'in_progress', 'queued', 'cancelled'] }, sinceDays: { type: 'number' } }, additionalProperties: false },
      },
    },
    async run(repo, args) {
      const status = str(args.status) as 'failed' | undefined;
      const page = await repo.deployments.list({ projectId: str(args.projectId), status: status ? [status] : [], environment: [], page: 1, pageSize: 50 });
      const since = typeof args.sinceDays === 'number' ? Date.now() - args.sinceDays * 86_400_000 : 0;
      const items = page.items.filter((d) => new Date(d.startedAt).getTime() >= since).slice(0, 8);
      return {
        data: items.map((d) => ({ id: d.id, number: d.number, projectId: d.projectId, status: d.status, environment: d.environment, commit: d.commitSha, message: d.commitMessage, author: d.author, startedAt: d.startedAt, failedTests: d.tests.failed })),
        sources: items.map((d) => ({ type: 'deployment', id: d.id, label: `Deployment #${d.number} · ${d.environment}`, href: `/projects/${d.projectId}/deployments/${d.number}` })),
      };
    },
  },
  list_pull_requests: {
    definition: {
      type: 'function',
      function: {
        name: 'list_pull_requests',
        description: 'List pull requests sorted by risk. Use for questions about risky or pending changes.',
        parameters: { type: 'object', properties: { projectId: { type: 'string' }, openOnly: { type: 'boolean' }, minRisk: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] } }, additionalProperties: false },
      },
    },
    async run(repo, args) {
      const levels = ['low', 'medium', 'high', 'critical'] as const;
      const min = levels.indexOf((str(args.minRisk) as (typeof levels)[number]) ?? 'low');
      const page = await repo.pullRequests.list({ projectId: str(args.projectId), status: args.openOnly ? ['open', 'draft'] : [], risk: levels.slice(Math.max(0, min)) as unknown as (typeof levels)[number][], sort: 'risk.desc', page: 1, pageSize: 6 });
      return {
        data: page.items.map((p) => ({ number: p.number, projectId: p.projectId, title: p.title, author: p.author, status: p.status, riskScore: p.riskScore, riskLevel: p.riskLevel, failedTests: p.tests.failed })),
        sources: page.items.map((p) => ({ type: 'pull_request', id: p.id, label: `#${p.number} · ${p.title}`, href: `/projects/${p.projectId}/pull-requests/${p.number}` })),
      };
    },
  },
  get_project_health: {
    definition: {
      type: 'function',
      function: {
        name: 'get_project_health',
        description: 'Health score, failing deployments, active incidents and open PRs per project. Use for “why is X unhealthy”.',
        parameters: { type: 'object', properties: { projectId: { type: 'string' } }, additionalProperties: false },
      },
    },
    async run(repo, args) {
      const projects = (await repo.projects.list()).filter((p) => !str(args.projectId) || p.id === args.projectId).sort((a, b) => a.healthScore - b.healthScore);
      return {
        data: projects.map((p) => ({ id: p.id, name: p.name, healthScore: p.healthScore, status: p.status, deploymentStatus: p.deploymentStatus, activeIncidents: p.activeIncidents, openPullRequests: p.openPullRequests })),
        sources: projects.slice(0, 3).map((p) => ({ type: 'project', id: p.id, label: p.name, href: `/projects/${p.id}` })),
      };
    },
  },
  get_recent_activity: {
    definition: {
      type: 'function',
      function: {
        name: 'get_recent_activity',
        description: 'Chronological feed of merges, deployments and incidents. Use for “what changed”.',
        parameters: { type: 'object', properties: { projectId: { type: 'string' }, limit: { type: 'number' } }, additionalProperties: false },
      },
    },
    async run(repo, args) {
      const items = await repo.analytics.activity({ projectId: str(args.projectId), limit: typeof args.limit === 'number' ? args.limit : 30 });
      return { data: items, sources: [] };
    },
  },
};

export const TOOL_DEFINITIONS = Object.values(TOOLS).map((t) => t.definition);

export const TOOL_STATUS: Record<string, string> = {
  list_incidents: 'Checking incidents…',
  list_deployments: 'Reading deployment history…',
  list_pull_requests: 'Ranking pull requests by risk…',
  get_project_health: 'Computing project health…',
  get_recent_activity: 'Scanning recent activity…',
};

/** Resolves the entity the user is looking at into prompt context + a source chip. */
export async function describeContext(repo: Repository, context: AIContext): Promise<{ text: string; source: SourceRef | null; projectId?: string }> {
  if (!context.id) return { text: 'The user is on the workspace-level view.', source: null };
  if (context.type === 'project') {
    const p = await repo.projects.get(context.id);
    return p ? { text: `Current project: ${p.name} (${p.id}), health ${p.healthScore}, latest deploy ${p.deploymentStatus}, ${p.activeIncidents} active incidents.`, source: { type: 'project', id: p.id, label: p.name, href: `/projects/${p.id}` }, projectId: p.id } : { text: '', source: null };
  }
  if (context.type === 'pull_request') {
    const [projectId, num] = context.id.split('#');
    const pr = await repo.pullRequests.get(projectId!, Number(num));
    return pr ? { text: `Current pull request: #${pr.number} “${pr.title}” by ${pr.author}, status ${pr.status}, risk ${pr.riskLevel} (${pr.riskScore}), tests ${pr.tests.passed}/${pr.tests.passed + pr.tests.failed} passing, files: ${pr.files.map((f) => f.path).join(', ')}. Description: ${pr.description}`, source: { type: 'pull_request', id: pr.id, label: `#${pr.number} · ${pr.title}`, href: `/projects/${pr.projectId}/pull-requests/${pr.number}` }, projectId: pr.projectId } : { text: '', source: null };
  }
  if (context.type === 'deployment') {
    const d = await repo.deployments.getById(context.id);
    return d ? { text: `Current deployment: #${d.number} to ${d.environment}, status ${d.status}, commit ${d.commitSha} “${d.commitMessage}”. Errors: ${d.logs.filter((l) => l.level === 'error').map((l) => l.message).join(' | ') || 'none'}. p95 ${d.performance.before.p95LatencyMs}ms → ${d.performance.after?.p95LatencyMs ?? 'n/a'}ms.`, source: { type: 'deployment', id: d.id, label: `Deployment #${d.number}`, href: `/projects/${d.projectId}/deployments/${d.number}` }, projectId: d.projectId } : { text: '', source: null };
  }
  const i = await repo.incidents.get(context.id);
  return i ? { text: `Current incident: ${i.reference} “${i.title}” ${i.severity}, ${i.status}, service ${i.service}, related deployment ${i.relatedDeploymentId ?? 'none'}. Timeline: ${i.timeline.map((e) => `${e.type}: ${e.title}`).join('; ')}`, source: { type: 'incident', id: i.id, label: `${i.reference} · ${i.title}`, href: `/projects/${i.projectId}/incidents/${i.id}` }, projectId: i.projectId } : { text: '', source: null };
}
