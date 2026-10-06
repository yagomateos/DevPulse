'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';
import { teamQueries, teamService } from '@/services/team';
import type { Role, TeamMember } from '@/types/domain';

export function useTeam() {
  return useQuery(teamQueries.list());
}

export function useInviteMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: teamService.invite,
    onSuccess: (member) => queryClient.setQueryData<TeamMember[]>(queryKeys.team.all, (list) => [...(list ?? []), member]),
  });
}

function useOptimisticTeamMutation<V>(mutationFn: (vars: V) => Promise<unknown>, apply: (list: TeamMember[], vars: V) => TeamMember[]) {
  const queryClient = useQueryClient();
  const key = queryKeys.team.all;
  return useMutation({
    mutationFn,
    onMutate: async (vars: V) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<TeamMember[]>(key);
      if (previous) queryClient.setQueryData(key, apply(previous, vars));
      return { previous };
    },
    onError: (_e, _v, ctx) => ctx?.previous && queryClient.setQueryData(key, ctx.previous),
    onSettled: () => queryClient.invalidateQueries({ queryKey: key }),
  });
}

export function useChangeRole() {
  return useOptimisticTeamMutation(
    ({ id, role }: { id: string; role: Role }) => teamService.changeRole(id, role),
    (list, { id, role }) => list.map((m) => (m.id === id ? { ...m, role } : m)),
  );
}

export function useRemoveMember() {
  return useOptimisticTeamMutation(
    (id: string) => teamService.remove(id),
    (list, id) => list.filter((m) => m.id !== id),
  );
}
