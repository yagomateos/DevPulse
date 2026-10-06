'use client';

import { useState } from 'react';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { axisProps, CHART_COLORS, ChartDataTable, ChartTooltip } from '@/components/charts/chart-primitives';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import type { DateRange, PerformanceSeriesPoint } from '@/types/domain';
import { useBucketLabel } from './deployment-chart';

const METRICS = {
  p95LatencyMs: { label: 'p95 latency', unit: 'ms', color: CHART_COLORS.primary, format: (v: number) => `${Math.round(v)} ms` },
  errorRate: { label: 'Error rate', unit: '%', color: CHART_COLORS.danger, format: (v: number) => `${v.toFixed(2)}%` },
} as const;
type MetricKey = keyof typeof METRICS;

export default function PerformanceChart({ data, range }: { data: PerformanceSeriesPoint[]; range: DateRange }) {
  const [metric, setMetric] = useState<MetricKey>('p95LatencyMs');
  const config = METRICS[metric];
  const label = useBucketLabel(range);
  const latest = data.at(-1)?.[metric];

  return (
    <figure className="space-y-3">
      <div className="flex justify-end">
        <ToggleGroup type="single" value={metric} onValueChange={(v) => v && setMetric(v as MetricKey)} aria-label="Metric">
          {(Object.keys(METRICS) as MetricKey[]).map((k) => (
            <ToggleGroupItem key={k} value={k}>
              {METRICS[k].label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>
      <div className="h-[220px]" aria-hidden>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ left: -16, right: 8, top: 4 }} accessibilityLayer={false}>
            <CartesianGrid vertical={false} stroke={CHART_COLORS.grid} strokeDasharray="3 3" />
            <XAxis dataKey="bucket" tickFormatter={label} {...axisProps} minTickGap={16} />
            <YAxis {...axisProps} tickFormatter={(v: number) => (metric === 'errorRate' ? `${v}%` : `${v}`)} width={48} />
            <Tooltip content={({ active, payload, label: l }) => <ChartTooltip active={active} payload={payload} label={l} formatLabel={label} formatValue={(v) => config.format(v)} />} />
            <Line isAnimationActive={false} type="monotone" dataKey={metric} name={config.label} stroke={config.color} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <figcaption className="sr-only">
        {config.label} over the selected period. Latest value {latest !== undefined ? config.format(latest) : 'unavailable'}.
      </figcaption>
      <ChartDataTable
        caption="Latency and error rate per period"
        rows={data}
        columns={[
          { key: 'bucket', label: 'Period', format: (v) => label(String(v)) },
          { key: 'p95LatencyMs', label: 'p95 latency', format: (v) => METRICS.p95LatencyMs.format(Number(v)) },
          { key: 'errorRate', label: 'Error rate', format: (v) => METRICS.errorRate.format(Number(v)) },
        ]}
      />
    </figure>
  );
}
