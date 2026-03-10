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
    } catch {
      await clearTokens();
    }
  },

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
      console.log("registering user", payload)
      const { data } = await api.post('/auth/register', payload);
      console.log(data)
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
