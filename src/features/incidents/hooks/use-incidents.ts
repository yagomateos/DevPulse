'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';
import type { UpdateIncidentInput } from '@/schemas/incident';
import type { IncidentQuery } from '@/schemas/query';
import { incidentQueries, incidentsService } from '@/services/incidents';
import type { Incident } from '@/types/domain';

export function useIncidents(query: Partial<IncidentQuery>) {
  return useQuery(incidentQueries.list(query));
}

export function useIncidentFacets(projectId?: string) {
  return useQuery(incidentQueries.facets(projectId));
}

export function useIncident(id: string) {
  return useQuery(incidentQueries.detail(id));
}

export function useCreateIncident() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: incidentsService.create,
    onSuccess: (incident) => {
      queryClient.setQueryData(queryKeys.incidents.detail(incident.id), incident);
      void queryClient.invalidateQueries({ queryKey: queryKeys.incidents.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.projects.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
    },
  });
}

/** Optimistic status change: badge flips immediately, rolls back on error. */
export function useUpdateIncident(id: string) {
  const queryClient = useQueryClient();
  const key = queryKeys.incidents.detail(id);
  return useMutation({
    mutationFn: (input: UpdateIncidentInput) => incidentsService.update(id, input),
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<Incident>(key);
      if (previous) queryClient.setQueryData<Incident>(key, { ...previous, status: input.status });
      return { previous };
    },
    onError: (_e, _v, ctx) => ctx?.previous && queryClient.setQueryData(key, ctx.previous),
    onSuccess: (incident) => queryClient.setQueryData(key, incident),
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['incidents', 'list'] });
      void queryClient.invalidateQueries({ queryKey: queryKeys.projects.all });
    },
  });
}
