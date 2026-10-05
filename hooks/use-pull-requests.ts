'use client';

import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function usePullRequests(projectId?: string) {
  return useQuery({
    queryKey: ['pull-requests', projectId],
    queryFn: () => api.getPullRequests(projectId),
  });
}

export function usePullRequest(prId: string) {
  return useQuery({
    queryKey: ['pull-requests', prId],
    queryFn: () => api.getPullRequest(prId),
    enabled: !!prId,
  });
}

export function useAnalyzePR() {
  return useMutation({
    mutationFn: (prId: string) => api.analyzePR(prId),
  });
}
