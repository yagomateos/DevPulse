'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';
import type { PullRequestQuery } from '@/schemas/query';
import { pullRequestQueries, pullRequestsService } from '@/services/pull-requests';

export function usePullRequests(query: Partial<PullRequestQuery>) {
  return useQuery(pullRequestQueries.list(query));
}

export function usePullRequest(projectId: string, number: number) {
  return useQuery(pullRequestQueries.detail(projectId, number));
}

/** Forces a GitHub backfill, then refreshes PR lists and the project's open-PR counter. */
export function useSyncPullRequests(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => pullRequestsService.syncFromGitHub(projectId),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.pullRequests.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.projects.all }),
      ]),
  });
}
