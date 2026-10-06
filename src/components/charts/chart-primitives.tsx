'use client';

import { cn } from '@/lib/utils';

export interface SeriesConfig {
  key: string;
  label: string;
  color: string;
}

export const CHART_COLORS = {
  primary: 'hsl(var(--chart-1))',
  success: 'hsl(var(--chart-2))',
  warning: 'hsl(var(--chart-3))',
  violet: 'hsl(var(--chart-4))',
  danger: 'hsl(var(--chart-5))',
  grid: 'hsl(var(--border))',
  axis: 'hsl(var(--muted-foreground))',
} as const;

export const axisProps = {
  stroke: CHART_COLORS.axis,
  fontSize: 11,
  tickLine: false,
  axisLine: false,
} as const;

interface TooltipEntry {
  name?: string | number;
  value?: number | string | readonly (number | string)[];
  color?: string;
  dataKey?: unknown;
}

/** Shared tooltip so every chart looks and reads the same. */
export function ChartTooltip({ active, payload, label, formatLabel, formatValue }: { active?: boolean; payload?: readonly TooltipEntry[]; label?: string | number; formatLabel?: (l: string) => string; formatValue?: (v: number, key: string) => string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="min-w-36 rounded-md border bg-popover px-3 py-2 text-xs shadow-xl">
      <p className="mb-1.5 font-medium">{formatLabel ? formatLabel(String(label)) : label}</p>
      <ul className="space-y-1">
        {payload.map((entry) => (
          <li key={String(entry.dataKey)} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <span className="size-2 rounded-sm" style={{ background: entry.color }} aria-hidden />
              {entry.name}
            </span>
            <span className="font-mono tabular-nums">{formatValue ? formatValue(Number(entry.value), String(entry.dataKey)) : String(entry.value)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Legend whose items toggle series visibility (keyboard accessible). */
export function ChartLegend({ series, hidden, onToggle }: { series: SeriesConfig[]; hidden: Set<string>; onToggle: (key: string) => void }) {
  return (
    <div className="flex flex-wrap items-center gap-1" role="group" aria-label="Toggle series">
      {series.map((s) => {
        const off = hidden.has(s.key);
        return (
          <button
            key={s.key}
            type="button"
            aria-pressed={!off}
            onClick={() => onToggle(s.key)}
            className={cn('flex items-center gap-1.5 rounded px-1.5 py-0.5 text-xs transition-opacity hover:bg-accent', off && 'text-muted-foreground line-through')}
          >
            <span className="size-2 rounded-sm" style={{ background: s.color }} aria-hidden />
            {s.label}
          </button>
        );
      })}
    </div>
  );
}

/**
 * Screen-reader equivalent of a chart. The SVG itself is decorative
 * (aria-hidden, not focusable); this table carries the actual data.
 */
export function ChartDataTable<T extends object>({ caption, rows, columns }: { caption: string; rows: T[]; columns: { key: keyof T & string; label: string; format?: (value: T[keyof T], row: T) => string }[] }) {
  return (
    <table className="sr-only">
      <caption>{caption}</caption>
      <thead>
        <tr>
          {columns.map((c) => (
            <th key={c.key} scope="col">
              {c.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={i}>
            {columns.map((c) => (
              <td key={c.key}>{c.format ? c.format(row[c.key], row) : String(row[c.key])}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
