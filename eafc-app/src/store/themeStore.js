import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const THEME_KEY = '@eafc_theme';

function getResolvedFromTime() {
  const hour = new Date().getHours();
  return hour >= 8 && hour < 19 ? 'light' : 'dark';
}

const useThemeStore = create((set, get) => ({
  theme: 'auto',
  resolvedTheme: getResolvedFromTime(),
  _intervalId: null,

  initialize: async () => {
    try {
      const saved = await AsyncStorage.getItem(THEME_KEY);
      if (saved === 'light' || saved === 'dark' || saved === 'auto') {
        set({ theme: saved });
      }
    } catch {}
    get().updateResolvedTheme();
    const id = setInterval(() => get().updateResolvedTheme(), 60_000);
    set({ _intervalId: id });
  },

  updateResolvedTheme: () => {
    const { theme } = get();
    const resolved = theme === 'auto' ? getResolvedFromTime() : theme;
    set({ resolvedTheme: resolved });
  },

  setTheme: async (theme) => {
    set({ theme });
    get().updateResolvedTheme();
    try {
      await AsyncStorage.setItem(THEME_KEY, theme);
    } catch {}
  },

  toggleTheme: async () => {
    const { theme } = get();
    const next = theme === 'auto' ? (getResolvedFromTime() === 'dark' ? 'light' : 'dark') : (theme === 'dark' ? 'light' : 'dark');
    set({ theme: next });
    get().updateResolvedTheme();
    try {
      await AsyncStorage.setItem(THEME_KEY, next);
    } catch {}
  },
}));

export default useThemeStore;
