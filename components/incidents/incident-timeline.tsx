'use client';

import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatRelativeTime } from '@/lib/format';
import type { IncidentTimelineEvent } from '@/types';
import {
  Rocket,
  AlertCircle,
  TrendingUp,
  Flag,
  Search,
  Wrench,
  CheckCircle,
  MessageSquare,
  type LucideIcon,
} from 'lucide-react';

const eventConfig: Record<
  IncidentTimelineEvent['type'],
  { icon: LucideIcon; color: string; bg: string }
> = {
  deployment: { icon: Rocket, color: 'text-info', bg: 'bg-info/10' },
  error: { icon: AlertCircle, color: 'text-destructive', bg: 'bg-destructive/10' },
  latency: { icon: TrendingUp, color: 'text-warning', bg: 'bg-warning/10' },
  created: { icon: Flag, color: 'text-primary', bg: 'bg-primary/10' },
  investigation: { icon: Search, color: 'text-info', bg: 'bg-info/10' },
  mitigation: { icon: Wrench, color: 'text-warning', bg: 'bg-warning/10' },
  resolution: { icon: CheckCircle, color: 'text-success', bg: 'bg-success/10' },
  comment: { icon: MessageSquare, color: 'text-muted-foreground', bg: 'bg-muted' },
};

export function IncidentTimeline({ events }: { events: IncidentTimelineEvent[] }) {
  return (
    <div className="relative">
      <div className="absolute left-4 top-2 bottom-2 w-px bg-border" />
      <div className="space-y-4">
        {events.map((event) => {
          const config = eventConfig[event.type];
          return (
            <div key={event.id} className="relative flex gap-4">
              <div
                className={cn(
                  'relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-background',
                  config.bg
                )}
              >
                <config.icon className={cn('h-4 w-4', config.color)} />
              </div>
              <div className="flex-1 pb-2">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium">{event.title}</p>
                  <span className="text-xs text-muted-foreground">
                    {formatRelativeTime(event.timestamp)}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {event.description}
                </p>
                {event.author && (
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <Avatar className="h-4 w-4">
                      <AvatarImage src={event.authorAvatar} alt={event.author} />
                      <AvatarFallback>{event.author.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span className="text-xs text-muted-foreground">{event.author}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
