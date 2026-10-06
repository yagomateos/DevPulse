/** All IANA time zones the runtime supports (Node 20+/modern browsers), with a safe fallback. */
export function supportedTimeZones(): string[] {
  const intl = Intl as typeof Intl & { supportedValuesOf?: (key: 'timeZone') => string[] };
  const zones = intl.supportedValuesOf?.('timeZone') ?? ['Europe/Madrid', 'Europe/London', 'America/New_York', 'America/Los_Angeles', 'Asia/Tokyo'];
  return zones.includes('UTC') ? zones : ['UTC', ...zones];
}

export function isValidTimeZone(zone: string) {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: zone });
    return true;
  } catch {
    return false;
  }
}

/** "Europe/Madrid" → current UTC offset label, e.g. "UTC+02:00". */
export function utcOffsetLabel(zone: string, at = new Date()) {
  try {
    const part = new Intl.DateTimeFormat('en-US', { timeZone: zone, timeZoneName: 'longOffset' }).formatToParts(at).find((p) => p.type === 'timeZoneName');
    return part?.value.replace('GMT', 'UTC') || 'UTC';
  } catch {
    return '';
  }
}
