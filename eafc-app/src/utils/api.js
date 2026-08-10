import axios from 'axios';
import { getAccessToken, getRefreshToken, setTokens, clearTokens } from '../services/tokenService';

/**
 * Legacy feature-screen client.
 * Talks to Stage via the mobile compat layer (`/api/mobile`), which maps
 * eafc flat paths (/teams, /social/feed, …) onto Stage entities (clubs, posts, …).
 *
 * Auth / onboarding use `stageClient` → `/api/stage` directly.
 */
const SOCKET_BASE =
  process.env.EXPO_PUBLIC_SOCKET_URL ||
  process.env.EXPO_PUBLIC_API_URL?.replace(/\/api\/(mobile|stage)\/?$/, '') ||
  'https://stage-7osn.onrender.com';

function resolveMobileBase() {
  const raw =
    process.env.EXPO_PUBLIC_API_URL ||
    'https://stageleagues.com/api/mobile';
  // Guard: if someone pointed API_URL at /api/stage, rewrite to /api/mobile
  // so screens that still call /teams and /social/* keep working.
  if (/\/api\/stage\/?$/.test(raw)) {
    return raw.replace(/\/api\/stage\/?$/, '/api/mobile');
  }
  return raw.replace(/\/$/, '');
}

const BASE_URL = resolveMobileBase();

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
        // Refresh is on Stage auth, not mobile compat.
        const stageAuthBase = (
          process.env.EXPO_PUBLIC_STAGE_API_URL ||
          'https://stageleagues.com/api/stage'
        ).replace(/\/$/, '');
        const { data } = await axios.post(`${stageAuthBase}/auth/refresh`, { refreshToken }, { headers });
        const accessToken = data?.data?.accessToken || data?.accessToken;
        const nextRefresh = data?.data?.refreshToken || data?.refreshToken || refreshToken;
        if (!accessToken) throw new Error('No access token in refresh response');
        await setTokens(accessToken, nextRefresh);
        original.headers.Authorization = `Bearer ${accessToken}`;
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
export const SOCKET_URL = SOCKET_BASE;
export { BASE_URL as API_BASE_URL };
