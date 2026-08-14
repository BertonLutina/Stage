import useThemeStore from '../../store/themeStore';
import { PAPER } from '../../lib/stageTheme';

describe('themeStore', () => {
  beforeEach(() => {
    const store = {};
    global.localStorage = {
      getItem: (key) => (Object.prototype.hasOwnProperty.call(store, key) ? store[key] : null),
      setItem: (key, value) => { store[String(key)] = String(value); },
      removeItem: (key) => { delete store[String(key)]; },
    };
    useThemeStore.getState().refresh();
  });

  test('maps Day and Custom onto Dark', () => {
    useThemeStore.getState().setStageTheme('theme-light');
    expect(useThemeStore.getState().tokens.id).toBe('theme-dark');
    useThemeStore.getState().setStageTheme('theme-custom');
    expect(useThemeStore.getState().tokens.id).toBe('theme-dark');
    useThemeStore.getState().setStageTheme('theme-white');
    expect(useThemeStore.getState().tokens.id).toBe('theme-dark');
  });

  test('live dark stays a dark planted surface with paper text', () => {
    useThemeStore.getState().setStageTheme('theme-video');
    const { tokens, liveDark } = useThemeStore.getState();
    expect(tokens.id).toBe('theme-video');
    expect(tokens.live).toBe(true);
    expect(tokens.text).toBe(PAPER);
    expect(liveDark).toBe(true);
    expect(useThemeStore.getState().liveDarkSource).toBeTruthy();
  });

  test('toggle switches Dark and Live Dark', () => {
    useThemeStore.getState().setStageTheme('theme-dark');
    useThemeStore.getState().toggleTheme();
    expect(useThemeStore.getState().liveDark).toBe(true);
    useThemeStore.getState().toggleTheme();
    expect(useThemeStore.getState().tokens.id).toBe('theme-dark');
    expect(useThemeStore.getState().liveDark).toBe(false);
  });
});
