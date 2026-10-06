import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { Sparkline } from '@/components/shared/sparkline';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { formatDelta } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { MetricValue } from '@/types/domain';

export interface MetricCardProps {
  label: string;
  metric: MetricValue;
  format?: (value: number) => string;
  unit?: string;
  /** Whether an increase is good (e.g. success rate) or bad (e.g. error rate). */
  goodWhen?: 'up' | 'down' | 'neutral';
  description: string;
  href?: string;
  icon?: ReactNode;
  isUpdating?: boolean;
}

/** KPI tile: value, period-over-period delta with semantic colour, sparkline, drill-down link. */
export function MetricCard({ label, metric, format = (v) => v.toLocaleString('en-US'), unit = '', goodWhen = 'up', description, href, icon, isUpdating }: MetricCardProps) {
  const direction = metric.delta > 0 ? 'up' : metric.delta < 0 ? 'down' : 'flat';
  const good = goodWhen === 'neutral' || direction === 'flat' ? null : direction === goodWhen;
  const DeltaIcon = direction === 'up' ? ArrowUpRight : direction === 'down' ? ArrowDownRight : Minus;
  const tone = good === null ? 'text-muted-foreground' : good ? 'text-success' : 'text-destructive';
  const sparkTone = good === false ? 'text-destructive' : 'text-primary';

  const body = (
    <>
      <div className="flex items-center justify-between gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="flex min-w-0 items-center gap-1.5 truncate text-xs font-medium text-muted-foreground">
              {icon}
              {label}
            </span>
          </TooltipTrigger>
          <TooltipContent>{description}</TooltipContent>
        </Tooltip>
        <span className={cn('flex items-center gap-0.5 text-xs font-medium tabular-nums', tone)}>
          <DeltaIcon className="size-3.5" aria-hidden />
          <span className="sr-only">{direction === 'flat' ? 'No change' : `${direction === 'up' ? 'Up' : 'Down'} by`}</span>
          {formatDelta(metric.delta, unit, Number.isInteger(metric.delta) ? 0 : Math.abs(metric.delta) < 0.1 ? 2 : 1)}
        </span>
      </div>
      <p className={cn('mt-2 text-xl font-semibold sm:text-2xl tracking-tight tabular-nums transition-opacity', isUpdating && 'opacity-50')}>
        {format(metric.value)}
        {unit && <span className="ml-0.5 text-base font-medium text-muted-foreground">{unit}</span>}
      </p>
      <Sparkline values={metric.sparkline} tone={sparkTone} className="mt-3" />
    </>
  );

  const className = 'block rounded-lg border bg-card p-3 transition-colors sm:p-4';
  return href ? (
    <Link href={href} className={cn(className, 'hover:border-primary/40 hover:bg-accent/30')} aria-label={`${label}: ${format(metric.value)}${unit}. View details`}>
      {body}
    </Link>
  ) : (
    <div className={className}>{body}</div>
  );
}
