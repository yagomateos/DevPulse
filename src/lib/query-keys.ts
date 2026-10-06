import type { DashboardQuery, DeploymentQuery, IncidentQuery, PullRequestQuery } from '@/schemas/query';
import type { AIAnalysisKind } from '@/schemas/ai';

/**
 * Hierarchical query keys. Invalidating a prefix (e.g. `queryKeys.incidents.all`)
 * refreshes every list and detail below it.
 */
export const queryKeys = {
  session: ['session'] as const,
  projects: {
    all: ['projects'] as const,
    list: (q?: string) => ['projects', 'list', q ?? ''] as const,
    detail: (id: string) => ['projects', 'detail', id] as const,
  },
  pullRequests: {
    all: ['pull-requests'] as const,
    list: (query: Partial<PullRequestQuery>) => ['pull-requests', 'list', query] as const,
    detail: (projectId: string, number: number) => ['pull-requests', 'detail', projectId, number] as const,
  },
  deployments: {
    all: ['deployments'] as const,
    list: (query: Partial<DeploymentQuery>) => ['deployments', 'list', query] as const,
    detail: (projectId: string, number: number) => ['deployments', 'detail', projectId, number] as const,
  },
  incidents: {
    all: ['incidents'] as const,
    list: (query: Partial<IncidentQuery>) => ['incidents', 'list', query] as const,
    facets: (projectId?: string) => ['incidents', 'facets', projectId ?? 'all'] as const,
    detail: (id: string) => ['incidents', 'detail', id] as const,
  },
  team: { all: ['team'] as const },
  notifications: { all: ['notifications'] as const },
  dashboard: {
    all: ['dashboard'] as const,
    metrics: (q: DashboardQuery) => ['dashboard', 'metrics', q] as const,
    deployments: (q: DashboardQuery) => ['dashboard', 'deployment-series', q] as const,
    performance: (q: DashboardQuery) => ['dashboard', 'performance-series', q] as const,
  },
  activity: (projectId?: string, limit?: number) => ['activity', projectId ?? 'all', limit ?? 12] as const,
  search: (q: string) => ['search', q] as const,
  settings: { all: ['settings'] as const },
  ai: {
    status: ['ai', 'status'] as const,
    analysis: (kind: AIAnalysisKind, projectId: string, key: string) => ['ai', 'analysis', kind, projectId, key] as const,
  },
};
