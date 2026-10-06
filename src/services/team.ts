import { queryOptions } from '@tanstack/react-query';
import { apiFetch, jsonBody } from '@/lib/http';
import { queryKeys } from '@/lib/query-keys';
import type { InviteMemberInput } from '@/schemas/team';
import type { Role, TeamMember } from '@/types/domain';

export const teamService = {
  list: () => apiFetch<TeamMember[]>('/api/team'),
  invite: (input: InviteMemberInput) => apiFetch<TeamMember>('/api/team', { method: 'POST', body: jsonBody(input) }),
  changeRole: (id: string, role: Role) => apiFetch<TeamMember>(`/api/team/${id}`, { method: 'PATCH', body: jsonBody({ role }) }),
  remove: (id: string) => apiFetch<void>(`/api/team/${id}`, { method: 'DELETE' }),
};

export const teamQueries = {
  list: () => queryOptions({ queryKey: queryKeys.team.all, queryFn: teamService.list }),
};
