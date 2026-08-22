/** Console labels used on Stage profiles (web + mobile). */

export const CONSOLE_OPTIONS = ['PS5', 'PS4', 'Xbox Series', 'Xbox One', 'PC'];

export function platformFamily(value) {
  const raw = String(value || '').trim().toLowerCase();
  if (!raw) return '';
  if (raw.includes('xbox')) return 'Xbox';
  if (raw.includes('pc') || raw.includes('steam')) return 'PC';
  if (raw.includes('ps') || raw.includes('play')) return 'PlayStation';
  return String(value).trim();
}

export function formatPlatformLabel(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  const lower = raw.toLowerCase().replace(/[_-]+/g, ' ');

  if (lower.includes('ps5') || lower.includes('playstation 5')) return 'PS5';
  if (lower.includes('ps4') || lower.includes('playstation 4')) return 'PS4';
  if (lower.includes('series')) return 'Xbox Series';
  if (lower.includes('xbox one') || lower === 'xb1') return 'Xbox One';
  if (lower === 'xbox' || lower.includes('xsx') || lower.includes('xss')) return 'Xbox Series';
  if (lower === 'pc' || lower.includes('steam') || lower.includes('origin')) return 'PC';
  if (lower === 'playstation' || lower === 'ps' || lower === 'psn') return 'PS5';
  if (CONSOLE_OPTIONS.includes(raw)) return raw;
  return raw.toUpperCase();
}

export function normalizeConsoleChoice(value) {
  const label = formatPlatformLabel(value);
  return CONSOLE_OPTIONS.includes(label) ? label : (label ? 'PS5' : '');
}

export function matchesPlatformFilter(value, selected) {
  if (!selected || selected === 'All') return true;
  const actual = String(value || '').trim();
  const wanted = String(selected).trim();
  if (!wanted) return true;
  if (actual === wanted) return true;
  if (CONSOLE_OPTIONS.includes(wanted)) return formatPlatformLabel(actual) === wanted;
  return Boolean(platformFamily(wanted) && platformFamily(wanted) === platformFamily(actual));
}
