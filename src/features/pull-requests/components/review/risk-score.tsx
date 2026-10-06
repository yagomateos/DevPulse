import { cn } from '@/lib/utils';
import type { RiskLevel } from '@/types/domain';

const TONE: Record<RiskLevel, string> = { low: 'text-success', medium: 'text-warning', high: 'text-destructive', critical: 'text-destructive' };
const LABEL: Record<RiskLevel, string> = { low: 'Low risk', medium: 'Medium risk', high: 'High risk', critical: 'Critical risk' };

/** Semicircular gauge (0–100) with a text equivalent for assistive tech. */
export function RiskScore({ score, level, size = 140, caption }: { score: number; level: RiskLevel; size?: number; caption?: string }) {
  const stroke = 10;
  const r = (size - stroke) / 2;
  const half = Math.PI * r;
  const offset = half - (Math.min(100, Math.max(0, score)) / 100) * half;
  return (
    <div className="flex flex-col items-center" role="img" aria-label={`Risk score ${score} of 100, ${LABEL[level]}`}>
      <svg width={size} height={size / 2 + stroke} viewBox={`0 0 ${size} ${size / 2 + stroke}`} className={TONE[level]} aria-hidden>
        <path d={`M ${stroke / 2} ${size / 2} A ${r} ${r} 0 0 1 ${size - stroke / 2} ${size / 2}`} fill="none" stroke="currentColor" strokeOpacity={0.15} strokeWidth={stroke} strokeLinecap="round" />
        <path
          d={`M ${stroke / 2} ${size / 2} A ${r} ${r} 0 0 1 ${size - stroke / 2} ${size / 2}`}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={half}
          strokeDashoffset={offset}
          className="transition-[stroke-dashoffset] duration-700 ease-out"
        />
      </svg>
      <div className="-mt-9 text-center">
        <p className="text-3xl font-semibold tabular-nums tracking-tight">{score}</p>
        <p className={cn('text-xs font-medium', TONE[level])}>{LABEL[level]}</p>
        {caption && <p className="mt-0.5 text-[11px] text-muted-foreground">{caption}</p>}
      </div>
    </div>
  );
}
