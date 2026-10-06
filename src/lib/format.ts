import { format, formatDistanceToNowStrict, isValid, parseISO } from 'date-fns';

const toDate = (value: string | Date) => (typeof value === 'string' ? parseISO(value) : value);

export function formatRelative(value: string | Date | null | undefined) {
  if (!value) return '—';
  const date = toDate(value);
  if (!isValid(date)) return '—';
  if (Math.abs(Date.now() - date.getTime()) < 45_000) return 'just now';
  return formatDistanceToNowStrict(date, { addSuffix: true });
}

export function formatDateTime(value: string | Date | null | undefined, pattern = 'MMM d, HH:mm') {
  if (!value) return '—';
  const date = toDate(value);
  return isValid(date) ? format(date, pattern) : '—';
}

export function formatDuration(seconds: number) {
  if (!seconds) return '—';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m === 0) return `${s}s`;
  if (m < 60) return `${m}m ${s.toString().padStart(2, '0')}s`;
  return `${Math.floor(m / 60)}h ${m % 60}m`;
}

export function formatNumber(value: number, options?: Intl.NumberFormatOptions) {
  return new Intl.NumberFormat('en-US', options).format(value);
}

export function formatCompact(value: number) {
  return formatNumber(value, { notation: 'compact', maximumFractionDigits: 1 });
}

export function formatPercent(value: number, digits = 1) {
  return `${value.toFixed(digits)}%`;
}

export function formatDelta(value: number, unit = '', digits = 1) {
  const sign = value > 0 ? '+' : value < 0 ? '−' : '±';
  return `${sign}${Math.abs(value).toFixed(digits)}${unit}`;
}

export function percentChange(before: number, after: number) {
  if (before === 0) return 0;
  return ((after - before) / before) * 100;
}
