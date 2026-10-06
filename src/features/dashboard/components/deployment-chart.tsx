'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { axisProps, CHART_COLORS, ChartLegend, ChartTooltip, type SeriesConfig } from '@/components/charts/chart-primitives';
import { useDateFormatter } from '@/features/settings/components/workspace-preferences-provider';
import type { DatePreset } from '@/lib/format';
import type { DateRange, DeploymentSeriesPoint } from '@/types/domain';

const SERIES: SeriesConfig[] = [
  { key: 'success', label: 'Successful', color: CHART_COLORS.success },
  { key: 'failed', label: 'Failed', color: CHART_COLORS.danger },
];

export const bucketPreset = (range: DateRange): DatePreset => (range === '24h' ? 'time' : 'day');

/** Bucket labels in the workspace time zone. */
export function useBucketLabel(range: DateRange) {
  const format = useDateFormatter();
  return (iso: string) => format(iso, bucketPreset(range));
}

/** Stacked deployments per bucket. Clicking a bar drills into the deployments list. */
export default function DeploymentChart({ data, range, projectId }: { data: DeploymentSeriesPoint[]; range: DateRange; projectId?: string }) {
  const router = useRouter();
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const toggle = (key: string) => setHidden((h) => (h.has(key) ? new Set([...h].filter((k) => k !== key)) : new Set(h).add(key)));
  const label = useBucketLabel(range);
  const total = data.reduce((a, d) => a + d.success + d.failed, 0);
  const failed = data.reduce((a, d) => a + d.failed, 0);

  return (
    <figure className="space-y-3">
      <div className="flex justify-end">
        <ChartLegend series={SERIES} hidden={hidden} onToggle={toggle} />
      </div>
      <div className="h-[220px]" aria-hidden>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ left: -24, right: 4, top: 4 }} barCategoryGap="20%">
            <CartesianGrid vertical={false} stroke={CHART_COLORS.grid} strokeDasharray="3 3" />
            <XAxis dataKey="bucket" tickFormatter={label} {...axisProps} minTickGap={16} />
            <YAxis allowDecimals={false} {...axisProps} />
            <Tooltip cursor={{ fill: 'hsl(var(--accent))', opacity: 0.6 }} content={({ active, payload, label: l }) => <ChartTooltip active={active} payload={payload} label={l} formatLabel={label} />} />
            {SERIES.map((s, i) => (
              <Bar
                key={s.key}
                dataKey={s.key}
                name={s.label}
                stackId="d"
                fill={s.color}
                hide={hidden.has(s.key)}
                radius={i === SERIES.length - 1 ? [3, 3, 0, 0] : 0}
                className="cursor-pointer"
                onClick={() => router.push(`/deployments${s.key === 'failed' ? '?status=failed' : ''}${projectId ? `${s.key === 'failed' ? '&' : '?'}projectId=${projectId}` : ''}`)}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
      <figcaption className="sr-only">
        {total} deployments in the period, {failed} failed.
      </figcaption>
    </figure>
  );
}
