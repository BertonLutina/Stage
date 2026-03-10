import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const THEME_KEY = '@eafc_theme';

const useThemeStore = create((set, get) => ({
  theme: 'dark',

  initialize: async () => {
    try {
      const saved = await AsyncStorage.getItem(THEME_KEY);
      if (saved === 'light' || saved === 'dark') {
        set({ theme: saved });
      }
    } catch {}
  },

  setTheme: async (theme) => {
    set({ theme });
    try {
      await AsyncStorage.setItem(THEME_KEY, theme);
    } catch {}
  },

  toggleTheme: async () => {
    const next = get().theme === 'dark' ? 'light' : 'dark';
    set({ theme: next });
    try {
      await AsyncStorage.setItem(THEME_KEY, next);
    } catch {}
  },
}));

export default useThemeStore;
