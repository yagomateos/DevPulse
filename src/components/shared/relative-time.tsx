'use client';

import { useDateFormatter } from '@/features/settings/components/workspace-preferences-provider';
import { formatRelative } from '@/lib/format';

/** Semantic <time> with an absolute timestamp (workspace time zone) as tooltip. */
export function RelativeTime({ value, className }: { value: string | null | undefined; className?: string }) {
  const format = useDateFormatter();
  if (!value) return <span className={className}>—</span>;
  return (
    // Relative text depends on "now", which differs by a few ms between server and client.
    <time dateTime={value} title={format(value, 'full')} className={className} suppressHydrationWarning>
      {formatRelative(value)}
    </time>
  );
}
