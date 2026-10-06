'use client';

import { useQuery } from '@tanstack/react-query';
import type { PullRequestQuery } from '@/schemas/query';
import { pullRequestQueries } from '@/services/pull-requests';

export function usePullRequests(query: Partial<PullRequestQuery>) {
  return useQuery(pullRequestQueries.list(query));
}

export function usePullRequest(projectId: string, number: number) {
  return useQuery(pullRequestQueries.detail(projectId, number));
}
