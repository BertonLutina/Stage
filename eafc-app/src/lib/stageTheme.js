const THEME_KEY = 'stage-theme';

export const STAGE_THEME_IDS = ['theme-dark', 'theme-video'];

const MARINE = '#0B1A3A';
/** HUD floodlight — cool off-white, never printer white */
const PAPER = '#E2EAF4';

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
  if (!rgb) return `rgba(0,240,255,${alpha})`;
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

function accents() {
  return {
    cyan: '#00F0FF',
    amber: '#FFD60A',
    cyanBorder: 'rgba(0,240,255,0.38)',
    amberBorder: 'rgba(255,214,10,0.42)',
    hairline: 'rgba(226,234,244,0.16)',
    glass: 'rgba(8,12,24,0.78)',
    card: 'rgba(10,18,32,0.92)',
    cardSolid: '#0A1220',
  };
}

function tokensFromSurface({ id, bg, primary, text, muted }) {
  const a = accents();
  const live = id === 'theme-video';
  const ink = text || PAPER;
  return {
    id,
    isDark: true,
    live,
    bg,
    text: ink,
    muted: muted || hexToRgba(ink, 0.58),
    faint: hexToRgba(ink, 0.38),
    primary: primary || a.cyan,
    primaryText: isDarkHex(primary || a.cyan) ? PAPER : MARINE,
    cyan: a.cyan,
    amber: a.amber,
    cyanBorder: a.cyanBorder,
    amberBorder: a.amberBorder,
    hairline: a.hairline,
    glass: live ? 'rgba(8,12,24,0.58)' : a.glass,
    card: live ? 'rgba(10,18,32,0.62)' : a.card,
    cardSolid: live ? 'rgba(10,18,32,0.62)' : a.cardSolid,
    inputFill: 'rgba(226,234,244,0.06)',
    inputBorder: 'rgba(226,234,244,0.16)',
    overlay: 'rgba(5,7,15,0.55)',
    barStyle: 'light-content',
    tileBorder: hexToRgba(primary || a.cyan, 0.32),
    tileFill: hexToRgba(primary || a.cyan, 0.12),
    wash: ['rgba(0,240,255,0.09)', 'transparent', 'rgba(255,214,10,0.05)'],
  };
}

const PRESETS = {
  'theme-dark': () => tokensFromSurface({
    id: 'theme-dark',
    bg: '#05070F',
    primary: '#00F0FF',
    text: PAPER,
  }),
  'theme-video': () => tokensFromSurface({
    id: 'theme-video',
    bg: '#02060D',
    primary: '#00F0FF',
    text: PAPER,
  }),
};

const REMOVED_THEMES = {
  'theme-light': 'theme-dark',
  'theme-white': 'theme-dark',
  'theme-custom': 'theme-dark',
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
