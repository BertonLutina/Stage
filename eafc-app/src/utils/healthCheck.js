import api from './api';

/**
 * Test backend connection. Call from login screen or settings.
 * @returns {{ ok: boolean, message: string }}
 */
export async function checkBackendConnection() {
  try {
    const { data } = await api.get('/health', { timeout: 5000 });
    return { ok: data?.status === 'ok', message: 'Connected' };
  } catch (err) {
    if (!err.response) {
      return { ok: false, message: 'Cannot reach backend. Is it running? Is ngrok active?' };
    }
    return { ok: false, message: err.response?.data?.message || 'Connection failed' };
  }
}
