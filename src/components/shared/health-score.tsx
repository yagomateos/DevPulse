import { cn } from '@/lib/utils';

export function healthTone(score: number) {
  if (score >= 85) return 'text-success';
  if (score >= 70) return 'text-warning';
  return 'text-destructive';
}

/** Radial health indicator with an accessible text equivalent. */
export function HealthScore({ score, size = 36, className, showLabel = true }: { score: number; size?: number; className?: string; showLabel?: boolean }) {
  const stroke = 3.5;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <span className={cn('inline-flex items-center gap-2', className)} role="img" aria-label={`Health score ${score} out of 100`}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className={cn('-rotate-90', healthTone(score))} aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeOpacity={0.15} strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeWidth={stroke} strokeDasharray={c} strokeDashoffset={c - (score / 100) * c} strokeLinecap="round" />
      </svg>
      {showLabel && <span className="text-sm font-semibold tabular-nums">{score}</span>}
    </span>
  );
}
