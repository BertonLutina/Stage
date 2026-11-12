import { CUSTOM_THEME_DEFAULTS } from './customThemeDefaults';

export const CUSTOM_THEME_KEY = 'stage-theme-custom';
const OPACITY_MIN = 0.3;
const OPACITY_MAX = 1;

const FIELDS = [
  ['primaryColor', 'customPrimaryColor'],
  ['gradientColor', 'customGradientColor'],
  ['backgroundColor', 'customBackgroundColor'],
  ['backgroundOpacity', 'customBackgroundOpacity'],
  ['textColor', 'customTextColor'],
  ['primaryTextColor', 'customPrimaryTextColor'],
  ['secondaryTextColor', 'customSecondaryTextColor'],
];

export function isHexColor(value) {
  return typeof value === 'string' && /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(value.trim());
}

function colorOr(value, fallback) {
  return isHexColor(value) ? String(value).trim() : fallback;
}

/** A complete custom theme: invalid or missing values fall back to the defaults. */
export function normalizeCustomTheme(raw = {}) {
  const src = raw && typeof raw === 'object' ? raw : {};
  const opacity = Number(src.backgroundOpacity);
  return {
    primaryColor: colorOr(src.primaryColor, CUSTOM_THEME_DEFAULTS.primaryColor),
    gradientColor: colorOr(src.gradientColor, CUSTOM_THEME_DEFAULTS.gradientColor),
    backgroundColor: colorOr(src.backgroundColor, CUSTOM_THEME_DEFAULTS.backgroundColor),
    backgroundOpacity: Number.isFinite(opacity) && src.backgroundOpacity !== '' && src.backgroundOpacity != null
      ? Math.min(OPACITY_MAX, Math.max(OPACITY_MIN, opacity))
      : CUSTOM_THEME_DEFAULTS.backgroundOpacity,
    textColor: colorOr(src.textColor, CUSTOM_THEME_DEFAULTS.textColor),
    primaryTextColor: colorOr(src.primaryTextColor, CUSTOM_THEME_DEFAULTS.primaryTextColor),
    secondaryTextColor: colorOr(src.secondaryTextColor, CUSTOM_THEME_DEFAULTS.secondaryTextColor),
  };
}

function storage() {
  return typeof localStorage !== 'undefined' ? localStorage : null;
}

export function readCustomTheme() {
  const store = storage();
  if (!store) return normalizeCustomTheme({});
  try {
    return normalizeCustomTheme(JSON.parse(store.getItem(CUSTOM_THEME_KEY) || '{}'));
  } catch {
    return normalizeCustomTheme({});
  }
}

/** Merges `patch` into the stored custom theme and returns the normalised result. */
export function writeCustomTheme(patch = {}) {
  const next = normalizeCustomTheme({ ...readCustomTheme(), ...patch });
  const store = storage();
  if (store) store.setItem(CUSTOM_THEME_KEY, JSON.stringify(next));
  return next;
}

/** The custom theme saved on the user (`customPrimaryColor` …), or null when none is set. */
export function customThemeFromUser(user) {
  if (!user || typeof user !== 'object') return null;
  const hasAny = FIELDS.some(([, userKey]) => user[userKey] != null && user[userKey] !== '');
  if (!hasAny) return null;
  const raw = {};
  FIELDS.forEach(([key, userKey]) => { if (user[userKey] != null && user[userKey] !== '') raw[key] = user[userKey]; });
  return normalizeCustomTheme(raw);
}

/** Payload for `auth.updateMe` with the user field names. */
export function customThemeToUser(custom) {
  const full = normalizeCustomTheme(custom);
  const out = {};
  FIELDS.forEach(([key, userKey]) => { out[userKey] = full[key]; });
  return out;
}
