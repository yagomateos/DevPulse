'use client';

import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { axisProps, CHART_COLORS, ChartDataTable, ChartTooltip } from '@/components/charts/chart-primitives';
import type { PerformancePoint } from '@/types/domain';

/** p95 latency around the release; the dashed line marks the deploy. */
export default function PerformanceSeriesChart({ series }: { series: PerformancePoint[] }) {
  return (
    <figure>
      <div className="h-[240px]" aria-hidden>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={series} margin={{ left: -12, right: 12, top: 8 }} accessibilityLayer={false}>
            <CartesianGrid vertical={false} stroke={CHART_COLORS.grid} strokeDasharray="3 3" />
            <XAxis dataKey="minute" tickFormatter={(m: number) => (m === 0 ? 'deploy' : `${m > 0 ? '+' : ''}${m}m`)} {...axisProps} />
            <YAxis yAxisId="lat" {...axisProps} width={48} tickFormatter={(v: number) => `${v}`} />
            <YAxis yAxisId="err" orientation="right" {...axisProps} width={40} tickFormatter={(v: number) => `${v}%`} />
            <Tooltip
              content={({ active, payload, label }) => (
                <ChartTooltip active={active} payload={payload} label={label} formatLabel={(l) => (l === '0' ? 'Deploy' : `${Number(l) > 0 ? '+' : ''}${l} min`)} formatValue={(v, key) => (key === 'errorRate' ? `${v.toFixed(2)}%` : `${v} ms`)} />
              )}
            />
            <ReferenceLine x={0} yAxisId="lat" stroke={CHART_COLORS.axis} strokeDasharray="4 4" label={{ value: 'Deploy', position: 'insideTopRight', fill: CHART_COLORS.axis, fontSize: 11 }} />
            <Line isAnimationActive={false} yAxisId="lat" type="monotone" dataKey="p95LatencyMs" name="p95 latency" stroke={CHART_COLORS.primary} strokeWidth={2} dot={false} />
            <Line isAnimationActive={false} yAxisId="err" type="monotone" dataKey="errorRate" name="Error rate" stroke={CHART_COLORS.danger} strokeWidth={1.5} dot={false} strokeDasharray="3 2" />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <ChartDataTable
        caption="Latency and error rate around the deployment"
        rows={series}
        columns={[
          { key: 'minute', label: 'Minutes from deploy', format: (v) => `${Number(v) > 0 ? '+' : ''}${v}` },
          { key: 'p95LatencyMs', label: 'p95 latency (ms)' },
          { key: 'errorRate', label: 'Error rate (%)' },
        ]}
      />
      <figcaption className="mt-2 flex gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="h-0.5 w-3 bg-primary" aria-hidden /> p95 latency (ms)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-0.5 w-3 bg-destructive" aria-hidden /> Error rate (%)
        </span>
      </figcaption>
    </figure>
  );
}
