import { create } from 'zustand';
import api from '../utils/api';
import { getAccessToken, setTokens, clearTokens } from '../services/tokenService';

const useAuthStore = create((set) => ({
  user: null,
  loading: false,
  error: null,

  initialize: async () => {
    try {
      const token = await getAccessToken();
      if (!token) return;
      const { data } = await api.get('/users/me');
      set({ user: data.data });
    } catch (err) {
      // Only clear tokens on explicit auth errors; keep them on network/backend issues
      const status = err?.response?.status;
      if (status === 401 || status === 403) {
        await clearTokens();
        set({ user: null });
      }
    }
  },

  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const { data } = await api.post('/auth/login', { email, password });
      await setTokens(data.data.accessToken, data.data.refreshToken);
      set({ user: data.data.user, loading: false });
    } catch (err) {
      let message = 'Login failed';
      if (!err.response) {
        message = 'Connection failed. Check network and that the backend is running.';
      } else if (err.response?.data?.message) {
        message = err.response.data.message;
      }
      set({ error: message, loading: false });
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

  setUserFromOAuth: async (accessToken, refreshToken, user) => {
    await setTokens(accessToken, refreshToken);
    set({ user: user || null });
  },

  updateUser: (user) => set({ user }),
}));

export default useAuthStore;
