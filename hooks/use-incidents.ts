'use client';

import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function useIncidents(projectId?: string) {
  return useQuery({
    queryKey: ['incidents', projectId],
    queryFn: () => api.getIncidents(projectId),
  });
}

export function useIncident(incidentId: string) {
  return useQuery({
    queryKey: ['incidents', incidentId],
    queryFn: () => api.getIncident(incidentId),
    enabled: !!incidentId,
  });
}

export function useInvestigateIncident() {
  return useMutation({
    mutationFn: (incidentId: string) => api.investigateIncident(incidentId),
  });
}
