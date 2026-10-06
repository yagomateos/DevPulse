import { ArrowUpCircle, Circle, MinusCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Recommendation as RecommendationType } from '@/schemas/ai';

const PRIORITY = {
  high: { icon: ArrowUpCircle, tone: 'text-destructive', label: 'High priority' },
  medium: { icon: MinusCircle, tone: 'text-warning', label: 'Medium priority' },
  low: { icon: Circle, tone: 'text-muted-foreground', label: 'Low priority' },
} as const;

export function Recommendation({ recommendation, index }: { recommendation: RecommendationType; index: number }) {
  const { icon: Icon, tone, label } = PRIORITY[recommendation.priority];
  return (
    <li className="flex gap-3">
      <span className="mt-0.5 font-mono text-[11px] text-muted-foreground">{String(index + 1).padStart(2, '0')}</span>
      <div className="min-w-0 flex-1 space-y-0.5">
        <p className="text-[13px] font-medium leading-snug">{recommendation.action}</p>
        <p className="text-xs text-muted-foreground">{recommendation.rationale}</p>
      </div>
      <Icon className={cn('mt-0.5 size-4 shrink-0', tone)} aria-label={label} />
    </li>
  );
}
