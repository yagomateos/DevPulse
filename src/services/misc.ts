import { queryOptions } from '@tanstack/react-query';
import { apiFetch, jsonBody } from '@/lib/http';
import { queryKeys } from '@/lib/query-keys';
import type { AccountSettings, SecuritySettingsInput, WorkspaceSettings } from '@/schemas/settings';
import type { Notification, SearchResult, TeamMember } from '@/types/domain';

export const searchService = {
  search: (q: string, signal?: AbortSignal) => apiFetch<SearchResult[]>('/api/search', { query: { q }, signal }),
};

export const notificationsService = {
  list: () => apiFetch<Notification[]>('/api/notifications'),
  markRead: (ids: string[] | 'all') => apiFetch<Notification[]>('/api/notifications', { method: 'PATCH', body: jsonBody({ ids }) }),
};

export const settingsService = {
  get: () => apiFetch<WorkspaceSettings>('/api/settings'),
  update: <K extends keyof WorkspaceSettings>(section: K, value: WorkspaceSettings[K]) =>
    apiFetch<WorkspaceSettings>(`/api/settings/${section}`, { method: 'PUT', body: jsonBody(value) }),
};

export const miscQueries = {
  search: (q: string) =>
    queryOptions({ queryKey: queryKeys.search(q), queryFn: ({ signal }) => searchService.search(q, signal), enabled: q.trim().length > 0, staleTime: 30_000 }),
  notifications: () => queryOptions({ queryKey: queryKeys.notifications.all, queryFn: notificationsService.list, refetchInterval: 60_000 }),
  settings: () => queryOptions({ queryKey: queryKeys.settings.all, queryFn: settingsService.get }),
};

export const accountService = {
  update: (input: AccountSettings) => apiFetch<TeamMember>('/api/account', { method: 'PUT', body: jsonBody(input) }),
  changePassword: (input: SecuritySettingsInput) => apiFetch<void>('/api/account/password', { method: 'POST', body: jsonBody(input) }),
};
