import { getStageApiBase, getStageOrigin } from './stageConfig';

/**
 * Test Stage server connection from the login screen.
 * @returns {{ ok: boolean, message: string, url?: string }}
 */
export async function checkBackendConnection() {
  const origin = getStageOrigin();
  const stageApi = getStageApiBase();
  const mobileApi = (
    process.env.EXPO_PUBLIC_API_URL ||
    `${origin}/api/mobile`
  ).replace(/\/api\/stage\/?$/, '/api/mobile').replace(/\/$/, '');

  const candidates = [
    `${origin}/health`,
    `${stageApi}/health`,
    `${mobileApi}/health`,
  ];

  let lastError = null;
  for (const url of candidates) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      const res = await fetch(url, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        signal: controller.signal,
      }).finally(() => clearTimeout(timeout));

      if (!res.ok) {
        lastError = `HTTP ${res.status}`;
        continue;
      }
      const data = await res.json().catch(() => ({}));
      const ok = data?.status === 'ok' || data?.ok === true;
      if (ok) {
        return { ok: true, message: `Connected to Stage (${url})`, url };
      }
      lastError = 'Unexpected health response';
    } catch (err) {
      if (err?.name === 'AbortError') {
        lastError = 'Timed out';
      } else {
        lastError = err?.message || 'Unreachable';
      }
    }
  }

  return {
    ok: false,
    message: `Cannot reach Stage (${origin}). ${lastError || 'Check network / VPN.'}`,
  };
}
