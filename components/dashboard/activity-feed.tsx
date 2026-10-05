'use client';

import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useActivityFeed } from '@/hooks/use-dashboard';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/shared/states';
import { formatRelativeTime } from '@/lib/format';
import {
  GitPullRequest,
  Rocket,
  AlertTriangle,
  FolderGit2,
  Users,
  type LucideIcon,
} from 'lucide-react';
import type { ActivityFeedItem } from '@/types';

const iconMap: Record<ActivityFeedItem['type'], LucideIcon> = {
  pr: GitPullRequest,
  deployment: Rocket,
  incident: AlertTriangle,
  project: FolderGit2,
  team: Users,
};

const iconColorMap: Record<ActivityFeedItem['type'], string> = {
  pr: 'text-info bg-info/10',
  deployment: 'text-success bg-success/10',
  incident: 'text-destructive bg-destructive/10',
  project: 'text-primary bg-primary/10',
  team: 'text-warning bg-warning/10',
};

export function ActivityFeed() {
  const { data: activities, isLoading } = useActivityFeed();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[400px]">
          {isLoading ? (
            <div className="space-y-4 p-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex gap-3">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-3 w-3/4" />
                    <Skeleton className="h-2.5 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : !activities || activities.length === 0 ? (
            <EmptyState
              title="No recent activity"
              description="Activity from your team will appear here."
              className="border-0"
            />
          ) : (
            <div className="space-y-1 p-4">
              {activities.map((item) => {
                const Icon = iconMap[item.type];
                return (
                  <Link
                    key={item.id}
                    href={
                      item.projectId
                        ? item.type === 'pr'
                          ? `/projects/${item.projectId}/pull-requests`
                          : item.type === 'deployment'
                            ? `/projects/${item.projectId}/deployments`
                            : item.type === 'incident'
                              ? `/projects/${item.projectId}/incidents`
                              : `/projects/${item.projectId}`
                        : '/team'
                    }
                    className="flex gap-3 rounded-md p-2 hover:bg-accent/50 transition-colors"
                  >
                    <div className="relative">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={item.actorAvatar} alt={item.actor} />
                        <AvatarFallback>{item.actor.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div
                        className={`absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full border-2 border-card ${iconColorMap[item.type]}`}
                      >
                        <Icon className="h-2.5 w-2.5" />
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium leading-tight">
                        {item.title}
                      </p>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {item.description}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground">
                          {item.actor}
                        </span>
                        <span className="text-xs text-muted-foreground">·</span>
                        <span className="text-xs text-muted-foreground">
                          {formatRelativeTime(item.timestamp)}
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
