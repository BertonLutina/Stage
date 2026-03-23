import axios from 'axios';
import { getAccessToken, getRefreshToken, setTokens, clearTokens } from '../services/tokenService';

// Use EXPO_PUBLIC_API_URL from .env - defaults: localhost for simulator, ngrok for physical device
// Simulator: http://localhost:3000  |  Android emulator: http://10.0.2.2:3000  |  Physical device: run `ngrok http 3000` and set the URL
const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(async (config) => {
  const token = await getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  const url = (config.baseURL || '') + (config.url || '');
  if (url.includes('ngrok')) {
    config.headers['ngrok-skip-browser-warning'] = '1';
  }
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
        const headers = { 'Content-Type': 'application/json' };
        if (BASE_URL.includes('ngrok')) headers['ngrok-skip-browser-warning'] = '1';
        const { data } = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken }, { headers });
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
export const SOCKET_URL = BASE_URL;
