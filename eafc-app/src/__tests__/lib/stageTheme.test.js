import {
  readStageTheme,
  normalizeThemeId,
  contrastTextFor,
  contrastRatio,
  isDarkHex,
  STAGE_THEME_IDS,
  writeStageThemeId,
  MARINE,
  PAPER,
} from '../../lib/stageTheme';

function mockLocalStorage() {
  const store = {};
  global.localStorage = {
    getItem: (key) => (Object.prototype.hasOwnProperty.call(store, key) ? store[key] : null),
    setItem: (key, value) => { store[String(key)] = String(value); },
    removeItem: (key) => { delete store[String(key)]; },
  };
}

describe('stage theme palettes', () => {
  beforeEach(() => {
    mockLocalStorage();
  });

  test('defaults to dark gamer shell', () => {
    const theme = readStageTheme();
    expect(theme.id).toBe('theme-dark');
    expect(theme.primary).toBe('#00F0FF');
    expect(theme.bg).toBe('#05070F');
    expect(theme.text).toBe(PAPER);
    expect(theme.isDark).toBe(true);
    expect(theme.live).toBe(false);
  });

  test('only keeps dark and live dark', () => {
    expect(STAGE_THEME_IDS).toEqual(['theme-dark', 'theme-video']);
  });

  test('maps removed Day, Custom, and LIVE WHITE onto Dark', () => {
    expect(normalizeThemeId('theme-white')).toBe('theme-dark');
    expect(normalizeThemeId('theme-light')).toBe('theme-dark');
    expect(normalizeThemeId('theme-custom')).toBe('theme-dark');
    expect(normalizeThemeId('theme-video')).toBe('theme-video');
    expect(normalizeThemeId('unknown')).toBe('theme-dark');
  });

  test('dark backgrounds get paper text and light backgrounds get marine ink', () => {
    expect(isDarkHex('#05070F')).toBe(true);
    expect(isDarkHex('#FFFFFF')).toBe(false);
    expect(contrastTextFor('#05070F')).toBe(PAPER);
    expect(contrastTextFor('#FFFFFF')).toBe(MARINE);
  });

  test('live dark is a planted photo shell with glass HUD', () => {
    writeStageThemeId('theme-video');
    const theme = readStageTheme();
    expect(theme.id).toBe('theme-video');
    expect(theme.live).toBe(true);
    expect(theme.isDark).toBe(true);
    expect(theme.text).toBe(PAPER);
    expect(theme.cyan).toBe('#00F0FF');
    expect(theme.hairline).toBe('rgba(226,234,244,0.16)');
    expect(theme.glass).toBe('rgba(8,12,24,0.58)');
    expect(theme.card).toBe('rgba(10,18,32,0.62)');
    expect(theme.cyanBorder).toBe('rgba(0,240,255,0.38)');
    expect(contrastRatio(PAPER, '#02060D')).toBeGreaterThanOrEqual(12);
  });

  test('writing a removed theme persists Dark', () => {
    expect(writeStageThemeId('theme-light')).toBe('theme-dark');
    expect(readStageTheme().id).toBe('theme-dark');
    expect(writeStageThemeId('theme-custom')).toBe('theme-dark');
    expect(readStageTheme().id).toBe('theme-dark');
  });

  test('dark HUD text is floodlight, not white, and still AA on night', () => {
    expect(PAPER.toUpperCase()).not.toBe('#FFFFFF');
    expect(PAPER.toUpperCase()).not.toBe('#F4F7FB');
    expect(contrastRatio(PAPER, '#05070F')).toBeGreaterThanOrEqual(12);
  });
});
