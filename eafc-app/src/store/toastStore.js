import { create } from 'zustand';

function normalizeToast(message) {
  return String(message || '').trim();
}

const useToastStore = create((set, get) => ({
  visible: false,
  message: '',
  queue: [],
  show: (message) => {
    const text = normalizeToast(message);
    if (!text) return;
    if (get().visible) {
      set({ queue: [...get().queue, text] });
      return;
    }
    set({ visible: true, message: text });
  },
  hide: () => {
    const [next, ...rest] = get().queue;
    if (next) {
      set({ visible: true, message: next, queue: rest });
      return;
    }
    set({ visible: false, message: '', queue: [] });
  },
}));

export default useToastStore;
