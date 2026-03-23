import * as WebBrowser from 'expo-web-browser';
import api from '../utils/api';
import useAuthStore from '../store/authStore';

const REDIRECT_URL = 'stage://auth/callback';

export function getSocialAuthUrl(provider) {
  const base = process.env.EXPO_PUBLIC_API_URL || api.defaults.baseURL;
  return `${base}/auth/${provider}`;
}

export async function openSocialAuth(provider) {
  const authUrl = getSocialAuthUrl(provider);

  try {
    const result = await WebBrowser.openAuthSessionAsync(authUrl, REDIRECT_URL);

    if (result.type === 'success' && result.url) {
      const query = result.url.includes('?') ? result.url.split('?')[1] : '';
      const params = new URLSearchParams(query);
      const accessToken = params.get('accessToken');
      const refreshToken = params.get('refreshToken');
      const userParam = params.get('user');

      if (accessToken && refreshToken) {
        let user = null;
        try {
          if (userParam) user = JSON.parse(decodeURIComponent(userParam));
        } catch (_) {}
        await useAuthStore.getState().setUserFromOAuth(accessToken, refreshToken, user);
        return { success: true };
      }
    }

    if (result.type === 'dismiss') {
      return { success: false, cancelled: true };
    }

    return { success: false };
  } catch (err) {
    return { success: false, error: err?.message };
  }
}
