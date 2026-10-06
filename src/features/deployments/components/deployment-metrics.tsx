import { CheckCircle2, Clock, Gauge, XCircle } from 'lucide-react';
import { formatDuration } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { Deployment } from '@/types/domain';

/** Headline numbers: duration, tests, p95 and error rate after release. */
export function DeploymentMetrics({ deployment }: { deployment: Deployment }) {
  const { tests, performance } = deployment;
  const after = performance.after;
  const items = [
    { label: 'Duration', value: formatDuration(deployment.durationSeconds), icon: Clock, tone: '' },
    { label: 'Tests', value: `${tests.passed}/${tests.passed + tests.failed}`, icon: tests.failed ? XCircle : CheckCircle2, tone: tests.failed ? 'text-destructive' : 'text-success' },
    { label: 'p95 after', value: after ? `${after.p95LatencyMs} ms` : '—', icon: Gauge, tone: after && after.p95LatencyMs > performance.before.p95LatencyMs * 1.25 ? 'text-destructive' : '' },
    { label: 'Error rate after', value: after ? `${after.errorRate}%` : '—', icon: Gauge, tone: after && after.errorRate > performance.before.errorRate + 0.5 ? 'text-destructive' : '' },
  ];
  return (
    <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {items.map((m) => (
        <div key={m.label} className="rounded-lg border bg-card p-3">
          <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <m.icon className={cn('size-3.5', m.tone)} aria-hidden /> {m.label}
          </dt>
          <dd className={cn('mt-1 text-lg font-semibold tabular-nums', m.tone)}>{m.value}</dd>
        </div>
      ))}
    </dl>
  );
}
