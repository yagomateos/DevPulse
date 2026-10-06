import { keepPreviousData, queryOptions } from '@tanstack/react-query';
import { apiFetch, jsonBody } from '@/lib/http';
import { queryKeys } from '@/lib/query-keys';
import type { CreateIncidentInput, UpdateIncidentInput } from '@/schemas/incident';
import type { IncidentQuery } from '@/schemas/query';
import type { Incident, IncidentSummary, Paginated } from '@/types/domain';

export const incidentsService = {
  list: (query: Partial<IncidentQuery>) => apiFetch<Paginated<IncidentSummary>>('/api/incidents', { query }),
  facets: (projectId?: string) => apiFetch<{ services: string[]; assignees: string[] }>('/api/incidents/facets', { query: { projectId } }),
  get: (id: string) => apiFetch<Incident>(`/api/incidents/${id}`),
  create: (input: CreateIncidentInput) => apiFetch<Incident>('/api/incidents', { method: 'POST', body: jsonBody(input) }),
  update: (id: string, input: UpdateIncidentInput) => apiFetch<Incident>(`/api/incidents/${id}`, { method: 'PATCH', body: jsonBody(input) }),
};

export const incidentQueries = {
  list: (query: Partial<IncidentQuery>) =>
    queryOptions({ queryKey: queryKeys.incidents.list(query), queryFn: () => incidentsService.list(query), placeholderData: keepPreviousData }),
  facets: (projectId?: string) =>
    queryOptions({ queryKey: queryKeys.incidents.facets(projectId), queryFn: () => incidentsService.facets(projectId), staleTime: 5 * 60_000 }),
  detail: (id: string) => queryOptions({ queryKey: queryKeys.incidents.detail(id), queryFn: () => incidentsService.get(id) }),
};
