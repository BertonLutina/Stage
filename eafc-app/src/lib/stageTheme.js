const THEME_KEY = 'stage-theme';
const CUSTOM_KEY = 'stage-theme-custom';

const THEMES = {
  'theme-dark': {
    id: 'theme-dark',
    bg: '#040d1a',
    card: 'rgba(10,22,36,0.92)',
    text: '#F2F5F8',
    muted: 'rgba(242,245,248,0.55)',
    primary: '#00E5BD',
    primaryText: '#041018',
    tileBorder: 'rgba(0,229,189,0.28)',
    tileFill: 'rgba(0,229,189,0.10)',
    inputBorder: 'rgba(0,229,189,0.28)',
    inputFill: 'rgba(255,255,255,0.04)',
    barStyle: 'light-content',
  },
  'theme-video': {
    id: 'theme-video',
    bg: '#02060d',
    card: 'rgba(8,16,28,0.78)',
    text: '#F2F5F8',
    muted: 'rgba(242,245,248,0.55)',
    primary: '#00E5BD',
    primaryText: '#041018',
    tileBorder: 'rgba(0,229,189,0.28)',
    tileFill: 'rgba(0,229,189,0.10)',
    inputBorder: 'rgba(0,229,189,0.28)',
    inputFill: 'rgba(255,255,255,0.04)',
    barStyle: 'light-content',
  },
  'theme-light': {
    id: 'theme-light',
    bg: '#EEF2F6',
    card: '#FFFFFF',
    text: '#0F1724',
    muted: 'rgba(15,23,36,0.55)',
    primary: '#0077C2',
    primaryText: '#FFFFFF',
    tileBorder: 'rgba(0,119,194,0.28)',
    tileFill: 'rgba(0,119,194,0.08)',
    inputBorder: 'rgba(0,119,194,0.28)',
    inputFill: '#FFFFFF',
    barStyle: 'dark-content',
  },
  'theme-white': {
    id: 'theme-white',
    bg: '#F7F7F7',
    card: '#FFFFFF',
    text: '#0F1724',
    muted: 'rgba(15,23,36,0.52)',
    primary: '#007ACC',
    primaryText: '#FFFFFF',
    tileBorder: 'rgba(0,122,204,0.28)',
    tileFill: 'rgba(0,122,204,0.08)',
    inputBorder: 'rgba(0,122,204,0.28)',
    inputFill: '#FFFFFF',
    barStyle: 'dark-content',
  },
};

function hexToRgba(hex, alpha) {
  const raw = String(hex || '').replace('#', '');
  if (raw.length !== 6) return `rgba(0,229,189,${alpha})`;
  const n = Number.parseInt(raw, 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return `rgba(${r},${g},${b},${alpha})`;
}

export function readStageTheme() {
  const id = (typeof localStorage !== 'undefined' && localStorage.getItem(THEME_KEY)) || 'theme-dark';
  if (id === 'theme-custom') {
    let custom = {};
    try {
      custom = JSON.parse(localStorage.getItem(CUSTOM_KEY) || '{}');
    } catch {
      custom = {};
    }
    const primary = custom.primary || '#00d4ff';
    const bg = custom.background || '#0f0f0f';
    const text = custom.text || '#ffffff';
    return {
      id,
      bg,
      card: hexToRgba(bg, 0.92),
      text,
      muted: hexToRgba(custom.secondaryText || text, 0.55),
      primary,
      primaryText: custom.primaryText || '#041018',
      tileBorder: hexToRgba(primary, 0.28),
      tileFill: hexToRgba(primary, 0.10),
      inputBorder: hexToRgba(primary, 0.28),
      inputFill: hexToRgba(text, 0.04),
      barStyle: 'light-content',
    };
  }
  return THEMES[id] || THEMES['theme-dark'];
}

export function writeStageThemeCustom(custom) {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(CUSTOM_KEY, JSON.stringify(custom || {}));
}

export { THEME_KEY, CUSTOM_KEY };
