'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';
import type { WorkspaceSettings } from '@/schemas/settings';
import { accountService, miscQueries, settingsService } from '@/services/misc';

export function useSettings() {
  return useQuery(miscQueries.settings());
}

export function useUpdateSettings<K extends keyof WorkspaceSettings>(section: K) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (value: WorkspaceSettings[K]) => settingsService.update(section, value),
    onSuccess: (settings) => queryClient.setQueryData(queryKeys.settings.all, settings),
  });
}

export function useUpdateAccount() {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: accountService.update, onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.team.all }) });
}

export function useChangePassword() {
  return useMutation({ mutationFn: accountService.changePassword });
}
