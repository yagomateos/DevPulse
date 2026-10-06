'use client';

import { useQuery } from '@tanstack/react-query';
import type { DeploymentQuery } from '@/schemas/query';
import { deploymentQueries } from '@/services/deployments';

export function useDeployments(query: Partial<DeploymentQuery>) {
  return useQuery(deploymentQueries.list(query));
}

export function useDeployment(projectId: string, number: number, { enabled = true }: { enabled?: boolean } = {}) {
  return useQuery({ ...deploymentQueries.detail(projectId, number), enabled: enabled && !!projectId && number > 0 });
}
