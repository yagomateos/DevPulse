'use client';

import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface MetricCardProps {
  label: string;
  value: string | number;
  trend?: number;
  trendLabel?: string;
  icon?: React.ComponentType<{ className?: string }>;
  accent?: 'default' | 'success' | 'warning' | 'destructive' | 'info';
}

const accentColors: Record<string, string> = {
  default: 'text-primary',
  success: 'text-success',
  warning: 'text-warning',
  destructive: 'text-destructive',
  info: 'text-info',
};

export function MetricCard({
  label,
  value,
  trend,
  trendLabel,
  icon: Icon,
  accent = 'default',
}: MetricCardProps) {
  const isPositiveTrend = trend !== undefined && trend > 0;
  const isNegativeTrend = trend !== undefined && trend < 0;

  return (
    <Card className="overflow-hidden transition-colors hover:bg-accent/30">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium text-muted-foreground">
              {label}
            </p>
            <p className="mt-1.5 text-2xl font-semibold tabular-nums tracking-tight">
              {value}
            </p>
          </div>
          {Icon && (
            <div className={cn('shrink-0', accentColors[accent])}>
              <Icon className="h-5 w-5" />
            </div>
          )}
        </div>
        {trend !== undefined && (
          <div className="mt-2 flex items-center gap-1.5 text-xs">
            <span
              className={cn(
                'flex items-center gap-0.5 font-medium tabular-nums',
                isPositiveTrend && 'text-success',
                isNegativeTrend && 'text-destructive',
                !isPositiveTrend && !isNegativeTrend && 'text-muted-foreground'
              )}
            >
              {isPositiveTrend && <ArrowUpRight className="h-3 w-3" />}
              {isNegativeTrend && <ArrowDownRight className="h-3 w-3" />}
              {Math.abs(trend)}
              {typeof trend === 'number' && trend % 1 !== 0 ? '%' : ''}
            </span>
            {trendLabel && (
              <span className="text-muted-foreground">{trendLabel}</span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
