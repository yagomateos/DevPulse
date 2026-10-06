'use client';

import { AlertTriangle, Boxes, GitPullRequest, Rocket, Users, type LucideIcon } from 'lucide-react';
import Link from 'next/link';
import { EmptyState } from '@/components/feedback/empty-state';
import { LoadingSkeleton } from '@/components/feedback/loading-skeleton';
import { QueryState } from '@/components/feedback/query-state';
import { RelativeTime } from '@/components/shared/relative-time';
import { UserAvatar } from '@/components/shared/user-avatar';
import { cn } from '@/lib/utils';
import type { ActivityItem } from '@/types/domain';
import { useActivity } from '../hooks/use-metrics';

const ICONS: Record<ActivityItem['kind'], { icon: LucideIcon; tone: string }> = {
  pull_request: { icon: GitPullRequest, tone: 'text-primary' },
  deployment: { icon: Rocket, tone: 'text-success' },
  incident: { icon: AlertTriangle, tone: 'text-destructive' },
  project: { icon: Boxes, tone: 'text-info' },
  team: { icon: Users, tone: 'text-muted-foreground' },
};

export function ActivityFeed({ projectId, limit = 10 }: { projectId?: string; limit?: number }) {
  const query = useActivity(projectId, limit);
  return (
    <QueryState query={query} loading={<LoadingSkeleton variant="list" rows={6} />} empty={<EmptyState title="No activity yet" compact />} isEmpty={(d) => d.length === 0} compactError>
      {(items) => (
        <ol className="relative space-y-0.5" aria-label="Recent activity">
          {items.map((item, i) => {
            const { icon: Icon, tone } = ICONS[item.kind];
            const content = (
              <>
                <span className="relative flex flex-col items-center">
                  <span className="flex size-7 items-center justify-center rounded-full border bg-background">
                    <Icon className={cn('size-3.5', tone)} aria-hidden />
                  </span>
                  {i < items.length - 1 && <span className="absolute top-7 h-[calc(100%-4px)] w-px bg-border" aria-hidden />}
                </span>
                <span className="min-w-0 flex-1 pb-3">
                  <span className="block truncate text-[13px] font-medium">{item.title}</span>
                  <span className="block truncate text-xs text-muted-foreground">{item.description}</span>
                  <span className="mt-0.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    <UserAvatar name={item.actor} size="xs" /> {item.actor} · <RelativeTime value={item.occurredAt} />
                  </span>
                </span>
              </>
            );
            return (
              <li key={item.id}>
                {item.href ? (
                  <Link href={item.href} className="flex gap-3 rounded-md px-1.5 pt-1.5 hover:bg-accent/50">
                    {content}
                  </Link>
                ) : (
                  <div className="flex gap-3 px-1.5 pt-1.5">{content}</div>
                )}
              </li>
            );
          })}
        </ol>
      )}
    </QueryState>
  );
}
