import { create } from 'zustand';
import api from '../utils/api';
import { setTokens, clearTokens } from '../services/tokenService';

const useAuthStore = create((set) => ({
  user: null,
  loading: false,
  error: null,

  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const { data } = await api.post('/auth/login', { email, password });
      await setTokens(data.data.accessToken, data.data.refreshToken);
      set({ user: data.data.user, loading: false });
    } catch (err) {
      set({ error: err.response?.data?.message || 'Login failed', loading: false });
    }
  },

  register: async (payload) => {
    set({ loading: true, error: null });
    try {
      const { data } = await api.post('/auth/register', payload);
      await setTokens(data.data.accessToken, data.data.refreshToken);
      set({ user: data.data.user, loading: false });
    } catch (err) {
      set({ error: err.response?.data?.message || 'Register failed', loading: false });
    }
  },

  logout: async () => {
    await clearTokens();
    set({ user: null });
  },

  updateUser: (user) => set({ user }),
}));

export default useAuthStore;
