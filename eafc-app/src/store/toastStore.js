import { create } from 'zustand';

const useToastStore = create((set) => ({
  visible: false,
  message: '',
  show: (message) => set({ visible: true, message }),
  hide: () => set({ visible: false, message: '' }),
}));

export default useToastStore;
