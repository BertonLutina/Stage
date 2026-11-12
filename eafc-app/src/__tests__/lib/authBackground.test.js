import {
  AUTH_BG_DEFAULT_ID,
  AUTH_BG_GRADIENT_ID,
  AUTH_BG_OPTIONS,
  getAuthBackgroundState,
  getAuthBgFx,
  getAuthBgPreference,
  resetAuthBackground,
  setAuthBgFx,
  setAuthBgPreference,
} from '../../lib/authBackground';

beforeEach(() => {
  resetAuthBackground();
});

describe('authBackground (independent of Live Dark)', () => {
  test('ships Stage gradient plus photos from backgroundImages', () => {
    expect(AUTH_BG_OPTIONS.find((o) => o.id === AUTH_BG_GRADIENT_ID).src).toBeNull();
    expect(AUTH_BG_OPTIONS.filter((o) => o.src).length).toBe(10);
  });

  test('defaults to Neymar', () => {
    const state = getAuthBackgroundState();
    expect(state.preference).toBe('neymar');
    expect(AUTH_BG_DEFAULT_ID).toBe('neymar');
    expect(state.active).toBe(true);
    expect(state.source).toBeTruthy();
    expect(state.fx.blur).toBe(4);
    expect(state.fx.overlay).toBe(0.45);
  });

  test('Stage gradient option disables the photo wallpaper', () => {
    expect(setAuthBgPreference(AUTH_BG_GRADIENT_ID)).toBe(AUTH_BG_GRADIENT_ID);
    const state = getAuthBackgroundState();
    expect(state.active).toBe(false);
    expect(state.source).toBeNull();
  });

  test('rejects unknown ids back to Neymar default', () => {
    expect(setAuthBgPreference('nope')).toBe(AUTH_BG_DEFAULT_ID);
    expect(getAuthBgPreference()).toBe('neymar');
  });

  test('clamps blur and overlay', () => {
    expect(setAuthBgFx({ blur: 99, overlay: 2 })).toEqual({ blur: 16, overlay: 0.85 });
    expect(setAuthBgFx({ blur: -3, overlay: -1 })).toEqual({ blur: 0, overlay: 0 });
    expect(getAuthBgFx()).toEqual({ blur: 0, overlay: 0 });
  });

  test('reset restores Neymar default and fx', () => {
    setAuthBgPreference('winners');
    setAuthBgFx({ blur: 12, overlay: 0.7 });
    const next = resetAuthBackground();
    expect(next).toEqual({
      preference: AUTH_BG_DEFAULT_ID,
      fx: { blur: 4, overlay: 0.45 },
    });
    expect(getAuthBackgroundState().preference).toBe('neymar');
    expect(getAuthBackgroundState().active).toBe(true);
  });
});
