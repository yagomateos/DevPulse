import { keepPreviousData, queryOptions } from '@tanstack/react-query';
import { apiFetch } from '@/lib/http';
import { queryKeys } from '@/lib/query-keys';
import type { PullRequestQuery } from '@/schemas/query';
import type { Paginated, PullRequest, PullRequestSummary } from '@/types/domain';

export const pullRequestsService = {
  list: (query: Partial<PullRequestQuery>) => apiFetch<Paginated<PullRequestSummary>>('/api/pull-requests', { query }),
  get: (projectId: string, number: number) => apiFetch<PullRequest>(`/api/projects/${projectId}/pull-requests/${number}`),
  syncFromGitHub: (projectId: string) =>
    apiFetch<{ synced: number; skipped: number; failed: number; error?: string }>(`/api/projects/${projectId}/sync`, { method: 'POST' }),
};

export const pullRequestQueries = {
  list: (query: Partial<PullRequestQuery>) =>
    queryOptions({ queryKey: queryKeys.pullRequests.list(query), queryFn: () => pullRequestsService.list(query), placeholderData: keepPreviousData }),
  detail: (projectId: string, number: number) =>
    queryOptions({ queryKey: queryKeys.pullRequests.detail(projectId, number), queryFn: () => pullRequestsService.get(projectId, number) }),
};
