'use client';

import { CheckStatusIcon } from '@/components/status/status-badges';
import { formatDuration } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { DeploymentStage } from '@/types/domain';
import { useDateFormatter } from '@/features/settings/components/workspace-preferences-provider';

/** Pipeline stages as a horizontal timeline (vertical on mobile). */
export function DeploymentTimeline({ stages }: { stages: DeploymentStage[] }) {
  const formatDate = useDateFormatter();
  const total = stages.reduce((a, s) => a + s.durationSeconds, 0) || 1;
  return (
    <div className="space-y-3">
      <div className="hidden h-2 overflow-hidden rounded-full bg-muted sm:flex" aria-hidden>
        {stages
          .filter((s) => s.durationSeconds > 0)
          .map((s) => (
            <span
              key={s.id}
              style={{ width: `${(s.durationSeconds / total) * 100}%` }}
              className={cn('h-full border-r border-background last:border-0', s.status === 'success' ? 'bg-success/70' : s.status === 'failed' ? 'bg-destructive' : s.status === 'running' ? 'animate-pulse bg-info' : 'bg-muted-foreground/30')}
            />
          ))}
      </div>
      <ol className="grid gap-2 sm:grid-cols-5" aria-label="Pipeline stages">
        {stages.map((s, i) => (
          <li key={s.id} className={cn('flex items-center gap-2.5 rounded-md border p-2.5 sm:flex-col sm:items-start', s.status === 'failed' && 'border-destructive/40 bg-destructive/5', (s.status === 'skipped' || s.status === 'pending') && 'border-dashed text-muted-foreground')}>
            <span className="flex items-center gap-2">
              <CheckStatusIcon status={s.status} />
              <span className="text-[13px] font-medium">
                <span className="sr-only">Step {i + 1}: </span>
                {s.name}
              </span>
            </span>
            <span className="ml-auto text-[11px] text-muted-foreground sm:ml-0">
              {s.durationSeconds ? formatDuration(s.durationSeconds) : s.status}
              {s.startedAt && <span className="hidden sm:inline"> · {formatDate(s.startedAt, 'time-seconds')}</span>}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}
