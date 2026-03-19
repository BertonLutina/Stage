import axios from 'axios';
import { getAccessToken, getRefreshToken, setTokens, clearTokens } from '../services/tokenService';

const BASE_URL = 'http://192.168.0.112:3000';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(async (config) => {
  const token = await getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const refreshToken = await getRefreshToken();
        const { data } = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken });
        await setTokens(data.data.accessToken, refreshToken);
        original.headers.Authorization = `Bearer ${data.data.accessToken}`;
        return api(original);
      } catch {
        await clearTokens();
        const { default: useAuthStore } = await import('../store/authStore');
        useAuthStore.getState().logout();
        return Promise.reject(error);
      }
    }
    return Promise.reject(error);
  }
);

export default api;
