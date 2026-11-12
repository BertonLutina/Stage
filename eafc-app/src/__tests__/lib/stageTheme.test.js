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
  CARD_RADIUS,
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
    expect(theme.primary).toBe('#4A6AA5');
    expect(theme.cyan).toBe('#4A6AA5');
    expect(theme.bg).toBe('#03153F');
    expect(theme.text).toBe(PAPER);
    expect(theme.muted).toBe('#9FB3D1');
    expect(theme.isDark).toBe(true);
    expect(theme.live).toBe(false);
    expect(theme.cardRadius).toBe(16);
    expect(CARD_RADIUS).toBe(16);
  });

  test('exposes the Stage design tokens verbatim', () => {
    const theme = readStageTheme();
    expect(PAPER).toBe('#EAF2FF');
    expect(MARINE).toBe('#07163A');
    expect(theme.bgDeep).toBe('#07163A');
    expect(theme.card).toBe('#132B5C');
    expect(theme.cardHi).toBe('#16346B');
    expect(theme.border).toBe('#234480');
    expect(theme.borderStrong).toBe('#4A6AA5');
    expect(theme.textSoft).toBe('#C9D8EE');
    expect(theme.cyanHi).toBe('#5B79AF');
    expect(theme.aqua).toBe('#3C5E99');
    expect(theme.onCyan).toBe(PAPER);
    expect(theme.success).toBe('#4ADE80');
    expect(theme.successBg).toBe('#14532D');
    expect(theme.danger).toBe('#F87171');
    expect(theme.dangerBg).toBe('#5B1A1A');
    expect(theme.warning).toBe('#FBBF24');
    expect(theme.warningBg).toBe('#2A2418');
    expect(theme.warningBorder).toBe('#B45309');
  });

  test('legacy keys are re-derived from the new palette', () => {
    const theme = readStageTheme();
    expect(theme.hairline).toBe(theme.border);
    expect(theme.inputFill).toBe(theme.bgDeep);
    expect(theme.inputBorder).toBe(theme.border);
    expect(theme.amber).toBe(theme.warning);
    expect(theme.cardSolid).toBe('#132B5C');
    expect(theme.wash.every((c) => c === 'transparent')).toBe(true);
  });

  test('text and accent colours meet contrast on the new surfaces', () => {
    const theme = readStageTheme();
    expect(contrastRatio(theme.muted, theme.card)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(theme.text, theme.bg)).toBeGreaterThanOrEqual(7);
    expect(contrastRatio(theme.onCyan, theme.cyan)).toBeGreaterThanOrEqual(4.5);
  });

  test('keeps dark, live dark and the real custom theme', () => {
    expect(STAGE_THEME_IDS).toEqual(['theme-dark', 'theme-video', 'theme-custom']);
  });

  test('maps removed Day and LIVE WHITE onto Dark; Custom is its own theme', () => {
    expect(normalizeThemeId('theme-white')).toBe('theme-dark');
    expect(normalizeThemeId('theme-light')).toBe('theme-dark');
    expect(normalizeThemeId('theme-custom')).toBe('theme-custom');
    expect(normalizeThemeId('theme-video')).toBe('theme-video');
    expect(normalizeThemeId('unknown')).toBe('theme-dark');
  });

  test('dark backgrounds get paper text and light backgrounds get marine ink', () => {
    expect(isDarkHex('#0A1F4A')).toBe(true);
    expect(isDarkHex('#FFFFFF')).toBe(false);
    expect(contrastTextFor('#0A1F4A')).toBe(PAPER);
    expect(contrastTextFor('#FFFFFF')).toBe(MARINE);
  });

  test('live dark is a planted photo shell with glass HUD', () => {
    writeStageThemeId('theme-video');
    const theme = readStageTheme();
    expect(theme.id).toBe('theme-video');
    expect(theme.live).toBe(true);
    expect(theme.isDark).toBe(true);
    expect(theme.text).toBe(PAPER);
    expect(theme.cyan).toBe('#4A6AA5');
    expect(theme.hairline).toBe('#234480');
    expect(theme.glass).toMatch(/^rgba\(19,43,92,/);
    expect(theme.card).toMatch(/^rgba\(19,43,92,/);
    expect(theme.cardHi).toMatch(/^rgba\(19,43,92,/);
    expect(theme.card).toBe('rgba(19,43,92,0.62)');
    expect(theme.cyanBorder).toBe('rgba(74,106,165,0.38)');
    expect(contrastRatio(PAPER, '#02060D')).toBeGreaterThanOrEqual(12);
  });

  test('writing a removed theme persists Dark, and Custom persists as Custom', () => {
    expect(writeStageThemeId('theme-light')).toBe('theme-dark');
    expect(readStageTheme().id).toBe('theme-dark');
    expect(writeStageThemeId('theme-custom')).toBe('theme-custom');
    expect(readStageTheme().id).toBe('theme-custom');
  });

  test('dark HUD text is floodlight, not white, and still AA on night', () => {
    expect(PAPER.toUpperCase()).not.toBe('#FFFFFF');
    expect(PAPER.toUpperCase()).not.toBe('#F4F7FB');
    expect(contrastRatio(PAPER, '#0A1F4A')).toBeGreaterThanOrEqual(12);
  });
});
