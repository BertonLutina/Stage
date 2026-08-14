import { Appearance } from 'react-native';
import { create } from 'zustand';
import { readStageTheme, writeStageThemeId } from '../lib/stageTheme';
import { getLiveDarkFx, getLiveDarkImageSource } from '../lib/liveDarkBackground';

function snapshot() {
  const tokens = readStageTheme();
  const live = tokens.live === true;
  return {
    stageId: tokens.id,
    tokens,
    resolvedTheme: 'dark',
    liveDark: live,
    liveDarkSource: live ? getLiveDarkImageSource() : null,
    liveDarkFx: live ? getLiveDarkFx() : { blur: 0, overlay: 0 },
  };
}

function applyAppearance() {
  if (typeof Appearance?.setColorScheme === 'function') {
    Appearance.setColorScheme('dark');
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
