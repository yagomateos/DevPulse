import { keepPreviousData, queryOptions } from '@tanstack/react-query';
import { apiFetch } from '@/lib/http';
import { queryKeys } from '@/lib/query-keys';
import type { DeploymentQuery } from '@/schemas/query';
import type { Deployment, DeploymentSummary, Paginated } from '@/types/domain';

export const deploymentsService = {
  list: (query: Partial<DeploymentQuery>) => apiFetch<Paginated<DeploymentSummary>>('/api/deployments', { query }),
  get: (projectId: string, number: number) => apiFetch<Deployment>(`/api/projects/${projectId}/deployments/${number}`),
};

export const deploymentQueries = {
  list: (query: Partial<DeploymentQuery>) =>
    queryOptions({ queryKey: queryKeys.deployments.list(query), queryFn: () => deploymentsService.list(query), placeholderData: keepPreviousData }),
  detail: (projectId: string, number: number) =>
    queryOptions({
      queryKey: queryKeys.deployments.detail(projectId, number),
      queryFn: () => deploymentsService.get(projectId, number),
      // Poll while a deployment is still running so the timeline updates live.
      refetchInterval: (query) => (query.state.data?.status === 'in_progress' || query.state.data?.status === 'queued' ? 5000 : false),
    }),
};
