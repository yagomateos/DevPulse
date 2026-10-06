import { formatDateTime, formatRelative } from '@/lib/format';

/** Semantic <time> with an absolute timestamp tooltip. */
export function RelativeTime({ value, className }: { value: string | null | undefined; className?: string }) {
  if (!value) return <span className={className}>—</span>;
  return (
    <time dateTime={value} title={formatDateTime(value, 'PPpp')} className={className} suppressHydrationWarning>
      {formatRelative(value)}
    </time>
  );
}
