import { Appearance } from 'react-native';
import { create } from 'zustand';
import { readStageTheme, writeStageThemeId } from '../lib/stageTheme';
import { getLiveDarkFx, getLiveDarkImageSource } from '../lib/liveDarkBackground';
import { getAuthBackgroundState } from '../lib/authBackground';

function snapshot() {
  const tokens = readStageTheme();
  const live = tokens.live === true;
  const authBg = getAuthBackgroundState();
  return {
    stageId: tokens.id,
    tokens,
    resolvedTheme: 'dark',
    liveDark: live,
    liveDarkSource: live ? getLiveDarkImageSource() : null,
    liveDarkFx: live ? getLiveDarkFx() : { blur: 0, overlay: 0 },
    authBgActive: authBg.active,
    authBgSource: authBg.source,
    authBgFx: authBg.fx,
    authBgPreference: authBg.preference,
  };
}

function applyAppearance() {
  if (typeof Appearance?.setColorScheme === 'function') {
    try {
      Appearance.setColorScheme('dark');
    } catch {
      // react-native-web throws when dark mode is media-based; ignore on web.
    }
  }
}

const useThemeStore = create((set, get) => ({
  theme: 'dark',
  ...snapshot(),
  _intervalId: null,

  refresh: () => {
    const next = snapshot();
    set({
      ...next,
      theme: 'dark',
    });
    applyAppearance();
    return next.tokens;
  },

  initialize: async () => {
    get().refresh();
  },

  setStageTheme: (id) => {
    writeStageThemeId(id);
    return get().refresh();
  },

  updateResolvedTheme: () => {
    get().refresh();
  },

  setTheme: async () => {
    get().setStageTheme('theme-dark');
  },

  toggleTheme: async () => {
    const next = get().liveDark ? 'theme-dark' : 'theme-video';
    get().setStageTheme(next);
  },
}));

export default useThemeStore;
