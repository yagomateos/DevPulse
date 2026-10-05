'use client';

import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function useDeployments(projectId?: string) {
  return useQuery({
    queryKey: ['deployments', projectId],
    queryFn: () => api.getDeployments(projectId),
  });
}

export function useDeployment(deploymentId: string) {
  return useQuery({
    queryKey: ['deployments', deploymentId],
    queryFn: () => api.getDeployment(deploymentId),
    enabled: !!deploymentId,
  });
}

export function useAnalyzeDeployment() {
  return useMutation({
    mutationFn: (deploymentId: string) => api.analyzeDeployment(deploymentId),
  });
}
