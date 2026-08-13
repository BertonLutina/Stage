export const DEFAULT_TIMEZONE = 'Europe/Brussels';

export const TIMEZONES = [
  { value: 'Europe/Brussels', label: 'Brussels, Belgium' },
  { value: 'Europe/London', label: 'London, UK' },
  { value: 'Europe/Paris', label: 'Paris, France' },
  { value: 'Europe/Amsterdam', label: 'Amsterdam, Netherlands' },
  { value: 'America/New_York', label: 'New York, USA' },
  { value: 'America/Los_Angeles', label: 'Los Angeles, USA' },
  { value: 'America/Toronto', label: 'Toronto, Canada' },
  { value: 'Africa/Lagos', label: 'Lagos, Nigeria' },
  { value: 'Africa/Johannesburg', label: 'Johannesburg, South Africa' },
  { value: 'Asia/Dubai', label: 'Dubai, UAE' },
];

export function detectTimezone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || DEFAULT_TIMEZONE;
  } catch {
    return DEFAULT_TIMEZONE;
  }
}

export function timezoneLabel(value) {
  const zone = TIMEZONES.find((item) => item.value === value);
  if (zone) return zone.label;
  const raw = String(value || '').trim();
  if (!raw) return DEFAULT_TIMEZONE;
  return raw.split('/')[1]?.replace(/_/g, ' ') || raw;
}

export function resolveTimezone(value) {
  const raw = String(value || '').trim();
  return raw || detectTimezone();
}
