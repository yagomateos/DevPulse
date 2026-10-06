import { describe, expect, it } from 'vitest';
import { formatDateTime, formatDelta, formatDuration, percentChange } from './format';
import { initials, pluralize } from './utils';

describe('formatting helpers', () => {
  it('formats durations compactly', () => {
    expect(formatDuration(0)).toBe('—');
    expect(formatDuration(42)).toBe('42s');
    expect(formatDuration(156)).toBe('2m 36s');
    expect(formatDuration(3_900)).toBe('1h 5m');
  });

  it('formats signed deltas with a real minus sign', () => {
    expect(formatDelta(2.5, '%')).toBe('+2.5%');
    expect(formatDelta(-3, '', 0)).toBe('−3');
    expect(formatDelta(0)).toBe('±0.0');
  });

  it('computes percent change safely', () => {
    expect(percentChange(200, 250)).toBe(25);
    expect(percentChange(0, 10)).toBe(0);
  });

  it('builds initials and plurals', () => {
    expect(initials('Sarah Kim')).toBe('SK');
    expect(initials('Alex')).toBe('A');
    expect(pluralize(1, 'incident')).toBe('1 incident');
    expect(pluralize(1200, 'user')).toBe('1,200 users');
  });
});

describe('formatDateTime (workspace time zone)', () => {
  const iso = '2026-10-05T07:33:00.000Z';

  it('renders the same instant in the configured zone, independent of the host zone', () => {
    expect(formatDateTime(iso, 'time', 'UTC')).toBe('07:33');
    expect(formatDateTime(iso, 'time', 'Europe/Madrid')).toBe('09:33');
    expect(formatDateTime(iso, 'time', 'America/New_York')).toBe('03:33');
  });

  it('falls back to UTC for unknown zones and handles empty values', () => {
    expect(formatDateTime(iso, 'time', 'Mars/Olympus')).toBe('07:33');
    expect(formatDateTime(null)).toBe('—');
    expect(formatDateTime('not a date')).toBe('—');
  });
});
