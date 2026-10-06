'use client';

import { AlertOctagon, Bell, ChevronDown, Gauge, MessageSquare, Rocket, Search, ShieldCheck, Wrench, type LucideIcon } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import type { TimelineEvent, TimelineEventType } from '@/types/domain';
import { useDateFormatter } from '@/features/settings/components/workspace-preferences-provider';

export const EVENT_META: Record<TimelineEventType, { label: string; icon: LucideIcon; tone: string }> = {
  deployment: { label: 'Deployment', icon: Rocket, tone: 'text-primary border-primary/40 bg-primary/10' },
  error: { label: 'Error', icon: AlertOctagon, tone: 'text-destructive border-destructive/40 bg-destructive/10' },
  latency: { label: 'Latency', icon: Gauge, tone: 'text-warning border-warning/40 bg-warning/10' },
  created: { label: 'Incident created', icon: Bell, tone: 'text-destructive border-destructive/40 bg-destructive/10' },
  investigation: { label: 'Investigation', icon: Search, tone: 'text-info border-info/40 bg-info/10' },
  mitigation: { label: 'Mitigation', icon: Wrench, tone: 'text-warning border-warning/40 bg-warning/10' },
  resolution: { label: 'Resolution', icon: ShieldCheck, tone: 'text-success border-success/40 bg-success/10' },
  note: { label: 'Note', icon: MessageSquare, tone: 'text-muted-foreground border-border bg-muted' },
};

function offsetLabel(from: number, at: string) {
  const minutes = Math.round((new Date(at).getTime() - from) / 60_000);
  if (minutes === 0) return 'T0';
  const abs = Math.abs(minutes);
  const value = abs >= 60 ? `${Math.floor(abs / 60)}h${abs % 60 ? ` ${abs % 60}m` : ''}` : `${abs}m`;
  return `T${minutes < 0 ? '−' : '+'}${value}`;
}

interface IncidentTimelineProps {
  events: TimelineEvent[];
  /** Reference point for T± offsets (usually the incident creation time). */
  startedAt: string;
}

/**
 * Reusable, interactive incident timeline: filter by event type, expand
 * events for details, relative T± offsets and deep links to related records.
 */
export function IncidentTimeline({ events, startedAt }: IncidentTimelineProps) {
  const formatDate = useDateFormatter();
  const sorted = useMemo(() => [...events].sort((a, b) => a.occurredAt.localeCompare(b.occurredAt)), [events]);
  const types = useMemo(() => [...new Set(sorted.map((e) => e.type))], [sorted]);
  const [hidden, setHidden] = useState<Set<TimelineEventType>>(new Set());
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set(sorted.filter((e) => e.type === 'deployment' || e.type === 'created').map((e) => e.id)));
  const start = new Date(startedAt).getTime();
  const visible = sorted.filter((e) => !hidden.has(e.type));

  const toggleType = (type: TimelineEventType) => setHidden((h) => (h.has(type) ? new Set([...h].filter((t) => t !== type)) : new Set(h).add(type)));
  const toggleEvent = (id: string) => setExpanded((s) => (s.has(id) ? new Set([...s].filter((x) => x !== id)) : new Set(s).add(id)));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter timeline by event type">
        {types.map((type) => {
          const meta = EVENT_META[type];
          const on = !hidden.has(type);
          return (
            <button
              key={type}
              type="button"
              aria-pressed={on}
              aria-label={`${meta.label} (${sorted.filter((e) => e.type === type).length})`}
              onClick={() => toggleType(type)}
              className={cn('flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs transition-colors', on ? meta.tone : 'border-dashed text-muted-foreground opacity-60 hover:opacity-100')}
            >
              <meta.icon className="size-3" aria-hidden />
              {meta.label}
              <span className="font-mono">{sorted.filter((e) => e.type === type).length}</span>
            </button>
          );
        })}
      </div>

      {visible.length === 0 ? (
        <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">All event types are filtered out.</p>
      ) : (
        <ol className="relative" aria-label="Incident timeline">
          {visible.map((event, i) => {
            const meta = EVENT_META[event.type];
            const open = expanded.has(event.id);
            const panelId = `${event.id}-details`;
            return (
              <li key={event.id} className="relative flex gap-3 pb-4 last:pb-0">
                {i < visible.length - 1 && <span className="absolute left-[15px] top-8 h-[calc(100%-24px)] w-px bg-border" aria-hidden />}
                <span className={cn('z-10 flex size-8 shrink-0 items-center justify-center rounded-full border', meta.tone)}>
                  <meta.icon className="size-3.5" aria-hidden />
                </span>
                <div className="min-w-0 flex-1 rounded-lg border bg-card">
                  <button type="button" onClick={() => toggleEvent(event.id)} aria-expanded={open} aria-controls={panelId} className="flex w-full items-center gap-3 px-3 py-2 text-left">
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-medium">{event.title}</span>
                      <span className="block text-[11px] text-muted-foreground">
                        <time dateTime={event.occurredAt}>{formatDate(event.occurredAt, 'time')}</time>
                        {event.actor && ` · ${event.actor}`}
                      </span>
                    </span>
                    <span className={cn('rounded px-1.5 py-0.5 font-mono text-[11px]', event.occurredAt < startedAt ? 'bg-muted text-muted-foreground' : 'bg-destructive/10 text-destructive')}>{offsetLabel(start, event.occurredAt)}</span>
                    <ChevronDown className={cn('size-4 shrink-0 text-muted-foreground transition-transform', open && 'rotate-180')} aria-hidden />
                  </button>
                  {open && (
                    <div id={panelId} className="space-y-2 border-t px-3 py-2.5 text-xs animate-fade-in">
                      <p className="text-muted-foreground">{event.description}</p>
                      {event.metadata && (
                        <dl className="flex flex-wrap gap-1.5">
                          {Object.entries(event.metadata).map(([k, v]) => (
                            <div key={k} className="flex gap-1 rounded bg-muted px-1.5 py-0.5 font-mono text-[11px]">
                              <dt className="text-muted-foreground">{k}</dt>
                              <dd>{v}</dd>
                            </div>
                          ))}
                        </dl>
                      )}
                      {event.href && (
                        <Link href={event.href} className="inline-block text-primary hover:underline">
                          Open related record →
                        </Link>
                      )}
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
