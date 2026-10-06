'use client';

import { AlertTriangle, AtSign, Bell, Eye, Rocket } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ErrorState } from '@/components/feedback/error-state';
import { LoadingSkeleton } from '@/components/feedback/loading-skeleton';
import { RelativeTime } from '@/components/shared/relative-time';
import { useMarkNotificationsRead, useNotifications } from '@/features/notifications/use-notifications';
import { cn } from '@/lib/utils';
import type { Notification } from '@/types/domain';
import { useState } from 'react';

const ICONS: Record<Notification['kind'], typeof Bell> = { incident: AlertTriangle, deployment: Rocket, review: Eye, mention: AtSign };
const TONES: Record<Notification['kind'], string> = { incident: 'text-destructive', deployment: 'text-warning', review: 'text-info', mention: 'text-primary' };

export function NotificationsMenu() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const query = useNotifications();
  const markRead = useMarkNotificationsRead();
  const unread = query.data?.filter((n) => !n.read).length ?? 0;

  const openNotification = (n: Notification) => {
    if (!n.read) markRead.mutate([n.id]);
    setOpen(false);
    router.push(n.href);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon-sm" className="relative" aria-label={unread ? `Notifications, ${unread} unread` : 'Notifications'}>
          <Bell />
          {unread > 0 && <span className="absolute right-1 top-1 flex size-3.5 items-center justify-center rounded-full bg-destructive text-[9px] font-semibold text-destructive-foreground" aria-hidden>{unread}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[22rem] p-0">
        <div className="flex items-center justify-between border-b px-3 py-2">
          <h2 className="text-sm font-medium">Notifications</h2>
          <Button size="xs" variant="ghost" disabled={unread === 0} onClick={() => markRead.mutate('all')}>
            Mark all as read
          </Button>
        </div>
        <div className="max-h-96 overflow-y-auto p-1 scrollbar-thin">
          {query.isPending ? (
            <LoadingSkeleton variant="list" rows={3} className="p-2" />
          ) : query.isError ? (
            <ErrorState error={query.error} onRetry={() => query.refetch()} compact className="m-2" />
          ) : query.data.length === 0 ? (
            <p className="p-6 text-center text-sm text-muted-foreground">You’re all caught up.</p>
          ) : (
            <ul>
              {query.data.map((n) => {
                const Icon = ICONS[n.kind];
                return (
                  <li key={n.id}>
                    <button type="button" onClick={() => openNotification(n)} className="flex w-full gap-3 rounded-md px-2 py-2 text-left hover:bg-accent focus-visible:bg-accent focus-visible:outline-none">
                      <Icon className={cn('mt-0.5 size-4 shrink-0', TONES[n.kind])} aria-hidden />
                      <span className="min-w-0 flex-1">
                        <span className={cn('block truncate text-[13px]', !n.read ? 'font-medium' : 'text-muted-foreground')}>{n.title}</span>
                        <span className="block truncate text-xs text-muted-foreground">{n.body}</span>
                        <RelativeTime value={n.createdAt} className="text-[11px] text-muted-foreground/80" />
                      </span>
                      {!n.read && <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" aria-label="Unread" />}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
