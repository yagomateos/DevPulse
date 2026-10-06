import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { formatNumber, percentChange } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { PerformanceSnapshot } from '@/types/domain';

const ROWS: { key: keyof PerformanceSnapshot; label: string; unit: string; lowerIsBetter: boolean }[] = [
  { key: 'p50LatencyMs', label: 'p50 latency', unit: 'ms', lowerIsBetter: true },
  { key: 'p95LatencyMs', label: 'p95 latency', unit: 'ms', lowerIsBetter: true },
  { key: 'errorRate', label: 'Error rate', unit: '%', lowerIsBetter: true },
  { key: 'throughputRps', label: 'Throughput', unit: 'rps', lowerIsBetter: false },
  { key: 'cpuPercent', label: 'CPU', unit: '%', lowerIsBetter: true },
  { key: 'memoryMb', label: 'Memory', unit: 'MB', lowerIsBetter: true },
];

/** Before/after table with semantic deltas (improvement vs regression). */
export function PerformanceComparison({ before, after }: { before: PerformanceSnapshot; after: PerformanceSnapshot | null }) {
  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-sm">
        <caption className="sr-only">Performance before and after this deployment</caption>
        <thead className="bg-muted/30 text-xs text-muted-foreground">
          <tr>
            <th scope="col" className="px-3 py-2 text-left font-medium">Metric</th>
            <th scope="col" className="px-3 py-2 text-right font-medium">Before</th>
            <th scope="col" className="px-3 py-2 text-right font-medium">After</th>
            <th scope="col" className="px-3 py-2 text-right font-medium">Change</th>
          </tr>
        </thead>
        <tbody>
          {ROWS.map((row) => {
            const b = before[row.key];
            const a = after?.[row.key];
            const change = a === undefined ? null : percentChange(b, a);
            const better = change === null || Math.abs(change) < 2 ? null : row.lowerIsBetter ? change < 0 : change > 0;
            const Icon = change !== null && change > 0 ? ArrowUpRight : ArrowDownRight;
            return (
              <tr key={row.key} className="border-t">
                <th scope="row" className="px-3 py-2 text-left font-normal">{row.label}</th>
                <td className="px-3 py-2 text-right font-mono tabular-nums text-muted-foreground">
                  {formatNumber(b)} {row.unit}
                </td>
                <td className="px-3 py-2 text-right font-mono tabular-nums">{a === undefined ? '—' : `${formatNumber(a)} ${row.unit}`}</td>
                <td className={cn('px-3 py-2 text-right font-mono text-xs tabular-nums', better === true && 'text-success', better === false && 'text-destructive', better === null && 'text-muted-foreground')}>
                  {change === null ? '—' : (
                    <span className="inline-flex items-center gap-0.5">
                      <Icon className="size-3" aria-hidden />
                      {change > 0 ? '+' : ''}
                      {change.toFixed(1)}%<span className="sr-only">{better === true ? ' (improved)' : better === false ? ' (regressed)' : ''}</span>
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
