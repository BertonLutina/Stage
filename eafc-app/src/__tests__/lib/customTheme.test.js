import {
  CUSTOM_THEME_KEY,
  customThemeFromUser,
  customThemeToUser,
  isHexColor,
  normalizeCustomTheme,
  readCustomTheme,
  writeCustomTheme,
} from '../../lib/customTheme';
import { CUSTOM_THEME_DEFAULTS } from '../../lib/customThemeDefaults';
import {
  STAGE_THEME_IDS, contrastRatio, normalizeThemeId, readStageTheme, writeStageThemeId,
} from '../../lib/stageTheme';

beforeEach(() => {
  const store = {};
  global.localStorage = {
    getItem: (key) => (Object.prototype.hasOwnProperty.call(store, key) ? store[key] : null),
    setItem: (key, value) => { store[String(key)] = String(value); },
    removeItem: (key) => { delete store[String(key)]; },
  };
});

describe('custom theme values', () => {
  test('isHexColor accepts #rgb and #rrggbb only', () => {
    expect(isHexColor('#fff')).toBe(true);
    expect(isHexColor('#00D4ff')).toBe(true);
    expect(isHexColor('00d4ff')).toBe(false);
    expect(isHexColor('#12345')).toBe(false);
    expect(isHexColor('red')).toBe(false);
    expect(isHexColor(null)).toBe(false);
  });

  test('normalize falls back to the defaults for missing or invalid values and clamps the opacity', () => {
    expect(normalizeCustomTheme({})).toEqual({
      primaryColor: CUSTOM_THEME_DEFAULTS.primaryColor,
      gradientColor: CUSTOM_THEME_DEFAULTS.gradientColor,
      backgroundColor: CUSTOM_THEME_DEFAULTS.backgroundColor,
      backgroundOpacity: CUSTOM_THEME_DEFAULTS.backgroundOpacity,
      textColor: CUSTOM_THEME_DEFAULTS.textColor,
      primaryTextColor: CUSTOM_THEME_DEFAULTS.primaryTextColor,
      secondaryTextColor: CUSTOM_THEME_DEFAULTS.secondaryTextColor,
    });
    expect(normalizeCustomTheme({ primaryColor: 'nope' }).primaryColor).toBe(CUSTOM_THEME_DEFAULTS.primaryColor);
    expect(normalizeCustomTheme({ backgroundOpacity: 5 }).backgroundOpacity).toBe(1);
    expect(normalizeCustomTheme({ backgroundOpacity: -1 }).backgroundOpacity).toBe(0.3);
    expect(normalizeCustomTheme({ backgroundOpacity: 'x' }).backgroundOpacity).toBe(CUSTOM_THEME_DEFAULTS.backgroundOpacity);
  });

  test('write merges into what is stored and read returns it', () => {
    expect(readCustomTheme()).toEqual(normalizeCustomTheme({}));
    writeCustomTheme({ primaryColor: '#ff0000' });
    writeCustomTheme({ backgroundColor: '#101010' });
    expect(readCustomTheme().primaryColor).toBe('#ff0000');
    expect(readCustomTheme().backgroundColor).toBe('#101010');
    expect(JSON.parse(global.localStorage.getItem(CUSTOM_THEME_KEY)).primaryColor).toBe('#ff0000');
  });

  test('a corrupt stored value reads as the defaults', () => {
    global.localStorage.setItem(CUSTOM_THEME_KEY, '{oops');
    expect(readCustomTheme()).toEqual(normalizeCustomTheme({}));
  });
});

describe('user fields', () => {
  test('customThemeFromUser reads the saved fields, null when the user has none', () => {
    expect(customThemeFromUser(null)).toBeNull();
    expect(customThemeFromUser({ language: 'en' })).toBeNull();
    const custom = customThemeFromUser({
      customPrimaryColor: '#112233', customGradientColor: '#445566', customBackgroundColor: '#010203',
      customBackgroundOpacity: '0.8', customTextColor: '#ffffff', customPrimaryTextColor: '#eeeeee', customSecondaryTextColor: '#dddddd',
    });
    expect(custom).toEqual({
      primaryColor: '#112233', gradientColor: '#445566', backgroundColor: '#010203', backgroundOpacity: 0.8,
      textColor: '#ffffff', primaryTextColor: '#eeeeee', secondaryTextColor: '#dddddd',
    });
  });

  test('customThemeToUser uses the user field names', () => {
    expect(customThemeToUser(normalizeCustomTheme({ primaryColor: '#123456' }))).toEqual({
      customPrimaryColor: '#123456',
      customGradientColor: CUSTOM_THEME_DEFAULTS.gradientColor,
      customBackgroundColor: CUSTOM_THEME_DEFAULTS.backgroundColor,
      customBackgroundOpacity: CUSTOM_THEME_DEFAULTS.backgroundOpacity,
      customTextColor: CUSTOM_THEME_DEFAULTS.textColor,
      customPrimaryTextColor: CUSTOM_THEME_DEFAULTS.primaryTextColor,
      customSecondaryTextColor: CUSTOM_THEME_DEFAULTS.secondaryTextColor,
    });
  });
});

describe('the Custom theme is real', () => {
  test('theme-custom is a theme id and no longer an alias of Dark', () => {
    expect(STAGE_THEME_IDS).toEqual(['theme-dark', 'theme-video', 'theme-custom']);
    expect(normalizeThemeId('theme-custom')).toBe('theme-custom');
    expect(writeStageThemeId('theme-custom')).toBe('theme-custom');
    expect(readStageTheme().id).toBe('theme-custom');
  });

  test('Day and Live White stay removed', () => {
    expect(normalizeThemeId('theme-light')).toBe('theme-dark');
    expect(normalizeThemeId('theme-white')).toBe('theme-dark');
  });

  test('the tokens follow the saved colours', () => {
    writeCustomTheme({ primaryColor: '#ff8800', backgroundColor: '#220e0e', textColor: '#ffffff' });
    writeStageThemeId('theme-custom');
    const theme = readStageTheme();
    expect(theme.id).toBe('theme-custom');
    expect(theme.live).toBe(false);
    expect(theme.bg).toBe('#220e0e');
    expect(theme.cyan).toBe('#ff8800');
    expect(theme.primary).toBe('#ff8800');
    expect(theme.text).toBe('#ffffff');
    expect(theme.customBackdrop).toEqual(expect.objectContaining({ from: '#220e0e' }));
  });

  test('unreadable text falls back to a readable colour, and the accent label stays readable', () => {
    writeCustomTheme({ backgroundColor: '#ffffff', textColor: '#fefefe', primaryColor: '#fffb00' });
    writeStageThemeId('theme-custom');
    const theme = readStageTheme();
    expect(contrastRatio(theme.text, theme.bg)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(theme.onCyan, theme.cyan)).toBeGreaterThanOrEqual(4.5);
  });

  test('Dark and Live Dark carry no custom backdrop', () => {
    writeStageThemeId('theme-dark');
    expect(readStageTheme().customBackdrop).toBeUndefined();
    writeStageThemeId('theme-video');
    expect(readStageTheme().customBackdrop).toBeUndefined();
  });
});
