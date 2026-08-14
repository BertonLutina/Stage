import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { isDashboardLayoutId } from '@/lib/dashboardLayouts';

const LAYOUT_KEY = 'eafc.dashboardLayoutPreview';
const SEEN_KEY = 'eafc.dashboardLayoutOnboarded';

const useDashboardLayoutStore = create((set, get) => ({
  layout: 'A',
  ready: false,
  needsOnboarding: false,

  initialize: async () => {
    if (get().ready) return;
    try {
      const [saved, seen] = await Promise.all([
        AsyncStorage.getItem(LAYOUT_KEY),
        AsyncStorage.getItem(SEEN_KEY),
      ]);
      const layout = isDashboardLayoutId(saved) ? saved : 'A';
      set({
        layout,
        ready: true,
        needsOnboarding: seen !== '1' && !isDashboardLayoutId(saved),
      });
    } catch {
      set({ ready: true, needsOnboarding: false });
    }
  },

  setLayout: async (next) => {
    if (!isDashboardLayoutId(next)) return;
    set({ layout: next });
    try {
      await AsyncStorage.setItem(LAYOUT_KEY, next);
    } catch {
      /* keep in-memory */
    }
  },

  completeOnboarding: async (next) => {
    if (isDashboardLayoutId(next)) {
      set({ layout: next });
      try {
        await AsyncStorage.setItem(LAYOUT_KEY, next);
      } catch {
        /* keep in-memory */
      }
    }
    set({ needsOnboarding: false });
    try {
      await AsyncStorage.setItem(SEEN_KEY, '1');
    } catch {
      /* keep in-memory */
    }
  },
}));

export default useDashboardLayoutStore;
