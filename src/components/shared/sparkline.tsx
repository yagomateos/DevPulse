import { cn } from '@/lib/utils';

interface SparklineProps {
  values: number[];
  className?: string;
  /** Tailwind text color class; the line uses currentColor. */
  tone?: string;
  height?: number;
}

/** Dependency-free SVG sparkline. Decorative: the value is always rendered as text nearby. */
export function Sparkline({ values, className, tone = 'text-primary', height = 28 }: SparklineProps) {
  if (values.length < 2) return <div style={{ height }} className={className} />;
  const width = 100;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const points = values.map((v, i) => [(i / (values.length - 1)) * width, height - 2 - ((v - min) / span) * (height - 4)] as const);
  const line = points.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  return (
    <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" aria-hidden className={cn('w-full overflow-visible', tone, className)} style={{ height }}>
      <path d={`${line} L${width},${height} L0,${height} Z`} fill="currentColor" opacity={0.08} />
      <path d={line} fill="none" stroke="currentColor" strokeWidth={1.5} vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
    </svg>
  );
}
