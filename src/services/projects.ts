import { queryOptions } from '@tanstack/react-query';
import { apiFetch, jsonBody } from '@/lib/http';
import { queryKeys } from '@/lib/query-keys';
import type { CreateProjectInput, ProjectSettingsInput } from '@/schemas/project';
import type { Project } from '@/types/domain';

export const projectsService = {
  list: (q?: string) => apiFetch<Project[]>('/api/projects', { query: { q } }),
  get: (id: string) => apiFetch<Project>(`/api/projects/${id}`),
  create: (input: CreateProjectInput) => apiFetch<Project>('/api/projects', { method: 'POST', body: jsonBody(input) }),
  update: (id: string, input: ProjectSettingsInput) => apiFetch<Project>(`/api/projects/${id}`, { method: 'PATCH', body: jsonBody(input) }),
};

export const projectQueries = {
  list: (q?: string) => queryOptions({ queryKey: queryKeys.projects.list(q), queryFn: () => projectsService.list(q) }),
  detail: (id: string) => queryOptions({ queryKey: queryKeys.projects.detail(id), queryFn: () => projectsService.get(id) }),
};
