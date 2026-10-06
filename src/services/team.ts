import { queryOptions } from '@tanstack/react-query';
import { apiFetch, jsonBody } from '@/lib/http';
import { queryKeys } from '@/lib/query-keys';
import type { InviteMemberInput } from '@/schemas/team';
import type { Role, TeamMember } from '@/types/domain';

export interface InvitationResult {
  member: TeamMember;
  invitation: { link: string; expiresAt: string; emailDelivered: boolean; emailProblem?: 'not-configured' | 'rejected' };
}

export const teamService = {
  list: () => apiFetch<TeamMember[]>('/api/team'),
  invite: (input: InviteMemberInput) => apiFetch<InvitationResult>('/api/team', { method: 'POST', body: jsonBody(input) }),
  resendInvitation: (id: string) => apiFetch<InvitationResult>(`/api/team/${id}/invitation`, { method: 'POST' }),
  changeRole: (id: string, role: Role) => apiFetch<TeamMember>(`/api/team/${id}`, { method: 'PATCH', body: jsonBody({ role }) }),
  remove: (id: string) => apiFetch<void>(`/api/team/${id}`, { method: 'DELETE' }),
};

export const teamQueries = {
  list: () => queryOptions({ queryKey: queryKeys.team.all, queryFn: teamService.list }),
};
