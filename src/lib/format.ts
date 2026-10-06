import { formatDistanceToNowStrict, isValid, parseISO } from 'date-fns';

const toDate = (value: string | Date) => (typeof value === 'string' ? parseISO(value) : value);

export function formatRelative(value: string | Date | null | undefined) {
  if (!value) return '—';
  const date = toDate(value);
  if (!isValid(date)) return '—';
  if (Math.abs(Date.now() - date.getTime()) < 45_000) return 'just now';
  return formatDistanceToNowStrict(date, { addSuffix: true });
}

export const DATE_PRESETS = {
  time: { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' },
  'time-seconds': { hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' },
  day: { month: 'short', day: 'numeric' },
  datetime: { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' },
  long: { dateStyle: 'medium', timeStyle: 'short' },
  full: { dateStyle: 'medium', timeStyle: 'long' },
} as const satisfies Record<string, Intl.DateTimeFormatOptions>;

export type DatePreset = keyof typeof DATE_PRESETS;

const formatterCache = new Map<string, Intl.DateTimeFormat>();

/**
 * Formats an absolute timestamp in an explicit IANA time zone (the workspace
 * setting). Because the zone is explicit, the server and the browser produce
 * identical strings — no hydration mismatch when the server runs in UTC.
 */
export function formatDateTime(value: string | Date | null | undefined, preset: DatePreset = 'datetime', timeZone = 'UTC') {
  if (!value) return '—';
  const date = toDate(value);
  if (!isValid(date)) return '—';
  const key = `${preset}|${timeZone}`;
  let formatter = formatterCache.get(key);
  if (!formatter) {
    try {
      formatter = new Intl.DateTimeFormat('en-US', { ...DATE_PRESETS[preset], timeZone });
    } catch {
      formatter = new Intl.DateTimeFormat('en-US', { ...DATE_PRESETS[preset], timeZone: 'UTC' });
    }
    formatterCache.set(key, formatter);
  }
  return formatter.format(date);
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
