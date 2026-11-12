import { readCustomTheme } from './customTheme';

const THEME_KEY = 'stage-theme';

export const STAGE_THEME_IDS = ['theme-dark', 'theme-video', 'theme-custom'];

/** Stage cards. Player/club identity plates keep their own radii. */
export const CARD_RADIUS = 16;

const MARINE = '#07163A';
/** Stage text — cool off-white, never printer white */
const PAPER = '#EAF2FF';

function hexToRgb(hex) {
  const raw = String(hex || '').replace('#', '').trim();
  if (raw.length === 3) {
    return {
      r: Number.parseInt(raw[0] + raw[0], 16),
      g: Number.parseInt(raw[1] + raw[1], 16),
      b: Number.parseInt(raw[2] + raw[2], 16),
    };
  }
  if (raw.length !== 6 || Number.isNaN(Number.parseInt(raw, 16))) return null;
  const n = Number.parseInt(raw, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

export function hexToRgba(hex, alpha) {
  const rgb = hexToRgb(hex);
  if (!rgb) return `rgba(74,106,165,${alpha})`;
  return `rgba(${rgb.r},${rgb.g},${rgb.b},${alpha})`;
}

function channel(c) {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

export function relativeLuminance(hex) {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0;
  return 0.2126 * channel(rgb.r) + 0.7152 * channel(rgb.g) + 0.0722 * channel(rgb.b);
}

export function isDarkHex(hex) {
  return relativeLuminance(hex) < 0.42;
}

export function contrastTextFor(bgHex) {
  return isDarkHex(bgHex) ? PAPER : MARINE;
}

export function contrastRatio(fgHex, bgHex) {
  const a = relativeLuminance(fgHex);
  const b = relativeLuminance(bgHex);
  const [hi, lo] = a > b ? [a, b] : [b, a];
  return (hi + 0.05) / (lo + 0.05);
}

/** Stage palette — verbatim from the redesign spec. */
const STAGE = {
  bg: '#03153F',
  bgDeep: '#07163A',
  card: '#132B5C',
  cardHi: '#16346B',
  border: '#234480',
  borderStrong: '#4A6AA5',
  textSoft: '#C9D8EE',
  muted: '#9FB3D1',
  cyan: '#4A6AA5',
  cyanHi: '#5B79AF',
  aqua: '#3C5E99',
  onCyan: PAPER,
  success: '#4ADE80',
  successBg: '#14532D',
  danger: '#F87171',
  dangerBg: '#5B1A1A',
  warning: '#FBBF24',
  warningBg: '#2A2418',
  warningBorder: '#B45309',
};

/** Raw palette for module-level constants that cannot read tokens (tile chrome, FUT). Prefer tokens in components. */
export const STAGE_PALETTE = Object.freeze({ ...STAGE });

/** Live Dark surfaces sit over the wallpaper, so they stay translucent. */
const LIVE_SURFACE = hexToRgba(STAGE.card, 0.62);

function tokensFromSurface({ id, bg, primary, text, muted }) {
  const live = id === 'theme-video';
  const ink = text || PAPER;
  const accent = primary || STAGE.cyan;
  return {
    id,
    isDark: true,
    live,
    bg,
    bgDeep: STAGE.bgDeep,
    text: ink,
    textSoft: STAGE.textSoft,
    muted: muted || STAGE.muted,
    faint: hexToRgba(ink, 0.38),
    primary: accent,
    primaryText: isDarkHex(accent) ? PAPER : MARINE,
    cyan: STAGE.cyan,
    cyanHi: STAGE.cyanHi,
    aqua: STAGE.aqua,
    onCyan: STAGE.onCyan,
    amber: STAGE.warning,
    success: STAGE.success,
    successBg: STAGE.successBg,
    danger: STAGE.danger,
    dangerBg: STAGE.dangerBg,
    warning: STAGE.warning,
    warningBg: STAGE.warningBg,
    warningBorder: STAGE.warningBorder,
    cyanBorder: hexToRgba(STAGE.cyan, 0.38),
    amberBorder: hexToRgba(STAGE.warning, 0.42),
    border: STAGE.border,
    borderStrong: STAGE.borderStrong,
    hairline: STAGE.border,
    glass: live ? LIVE_SURFACE : STAGE.card,
    card: live ? LIVE_SURFACE : STAGE.card,
    cardHi: live ? LIVE_SURFACE : STAGE.cardHi,
    cardSolid: live ? LIVE_SURFACE : STAGE.card,
    cardRadius: CARD_RADIUS,
    inputFill: STAGE.bgDeep,
    inputBorder: STAGE.border,
    overlay: hexToRgba(STAGE.bgDeep, 0.55),
    barStyle: 'light-content',
    tileBorder: hexToRgba(accent, 0.32),
    tileFill: hexToRgba(accent, 0.12),
    /** Flat background: the old floodlight wash is gone, stops stay for call-site compatibility. */
    wash: ['transparent', 'transparent', 'transparent'],
  };
}

function toHex(rgb) {
  const part = (v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0');
  return `#${part(rgb.r)}${part(rgb.g)}${part(rgb.b)}`;
}

/** Mixes `a` towards `b` by `t` (0 = a, 1 = b). */
export function mixHex(a, b, t) {
  const x = hexToRgb(a);
  const y = hexToRgb(b);
  if (!x || !y) return a;
  return toHex({ r: x.r + (y.r - x.r) * t, g: x.g + (y.g - x.g) * t, b: x.b + (y.b - x.b) * t });
}

function readable(preferred, bg, minRatio = 4.5) {
  return contrastRatio(preferred, bg) >= minRatio ? preferred : contrastTextFor(bg);
}

/** The user's own colours: surfaces are derived from the chosen background, text is kept readable. */
function customTokens() {
  const c = readCustomTheme();
  const bg = c.backgroundColor;
  const lift = isDarkHex(bg) ? '#FFFFFF' : '#000000';
  const text = readable(c.textColor, bg, 7);
  const base = tokensFromSurface({ id: 'theme-custom', bg, primary: c.primaryColor, text });
  const card = mixHex(bg, lift, 0.1);
  const cardHi = mixHex(bg, lift, 0.16);
  const border = mixHex(bg, lift, 0.24);
  const borderStrong = mixHex(bg, lift, 0.4);
  const onAccent = readable(c.primaryTextColor, c.primaryColor);
  return {
    ...base,
    bgDeep: mixHex(bg, '#000000', 0.35),
    textSoft: readable(c.secondaryTextColor, bg),
    muted: readable(mixHex(c.secondaryTextColor, bg, 0.3), bg),
    cyan: c.primaryColor,
    cyanHi: mixHex(c.primaryColor, '#FFFFFF', 0.25),
    aqua: c.gradientColor,
    onCyan: onAccent,
    primaryText: onAccent,
    cyanBorder: hexToRgba(c.primaryColor, 0.38),
    tileBorder: hexToRgba(c.primaryColor, 0.32),
    tileFill: hexToRgba(c.primaryColor, 0.12),
    border,
    borderStrong,
    hairline: border,
    glass: card,
    card,
    cardHi,
    cardSolid: card,
    inputFill: mixHex(bg, '#000000', 0.35),
    inputBorder: border,
    overlay: hexToRgba(mixHex(bg, '#000000', 0.5), 0.55),
    barStyle: isDarkHex(bg) ? 'light-content' : 'dark-content',
    isDark: isDarkHex(bg),
    /** Read by `StageBackground`: background → gradient colour, softened by the opacity. */
    customBackdrop: { from: bg, to: c.gradientColor, opacity: c.backgroundOpacity },
  };
}

const PRESETS = {
  'theme-dark': () => tokensFromSurface({
    id: 'theme-dark',
    bg: STAGE.bg,
    primary: STAGE.cyan,
    text: PAPER,
  }),
  'theme-video': () => tokensFromSurface({
    id: 'theme-video',
    bg: '#02060D',
    primary: STAGE.cyan,
    text: PAPER,
  }),
  'theme-custom': customTokens,
};

const REMOVED_THEMES = {
  'theme-light': 'theme-dark',
  'theme-white': 'theme-dark',
};

export function normalizeThemeId(id) {
  if (REMOVED_THEMES[id]) return REMOVED_THEMES[id];
  if (STAGE_THEME_IDS.includes(id)) return id;
  return 'theme-dark';
}

export function readStageThemeId() {
  const raw = (typeof localStorage !== 'undefined' && localStorage.getItem(THEME_KEY)) || 'theme-dark';
  return normalizeThemeId(raw);
}

export function readStageTheme() {
  const id = readStageThemeId();
  return (PRESETS[id] || PRESETS['theme-dark'])();
}

export function writeStageThemeId(id) {
  if (typeof localStorage === 'undefined') return normalizeThemeId(id);
  const next = normalizeThemeId(id);
  localStorage.setItem(THEME_KEY, next);
  return next;
}

export { THEME_KEY, MARINE, PAPER };
