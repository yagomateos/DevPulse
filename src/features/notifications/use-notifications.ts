'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';
import { miscQueries, notificationsService } from '@/services/misc';
import type { Notification } from '@/types/domain';

export function useNotifications() {
  return useQuery(miscQueries.notifications());
}

/** Optimistic "mark as read": the badge clears instantly, rolls back on failure. */
export function useMarkNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: notificationsService.markRead,
    onMutate: async (ids) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.notifications.all });
      const previous = queryClient.getQueryData<Notification[]>(queryKeys.notifications.all);
      queryClient.setQueryData<Notification[]>(queryKeys.notifications.all, (list) => list?.map((n) => (ids === 'all' || ids.includes(n.id) ? { ...n, read: true } : n)));
      return { previous };
    },
    onError: (_error, _ids, context) => {
      if (context?.previous) queryClient.setQueryData(queryKeys.notifications.all, context.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all }),
  });
}
