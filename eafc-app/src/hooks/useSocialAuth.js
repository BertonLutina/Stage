import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import useAuthStore from '../store/authStore';
import { getStageApiBase } from '../utils/stageConfig';

WebBrowser.maybeCompleteAuthSession?.();

/** Matches app.json scheme + Expo Go exp://…/--/auth/callback */
function getRedirectUrl() {
  return makeRedirectUri({
    scheme: 'stage',
    path: 'auth/callback',
  });
}

/** Stage OAuth providers mounted at /api/stage/auth/:provider */
export const STAGE_OAUTH_PROVIDERS = ['google', 'microsoft', 'twitch', 'kick'];

export function getSocialAuthUrl(provider, redirectUri = getRedirectUrl()) {
  const base = getStageApiBase();
  const q = new URLSearchParams({
    client: 'mobile',
    redirect_uri: redirectUri,
  });
  return `${base}/auth/${provider}?${q}`;
}

function parseOAuthCallbackUrl(url) {
  if (!url) return null;
  try {
    const query = url.includes('?') ? url.slice(url.indexOf('?') + 1) : '';
    const params = new URLSearchParams(query);
    const accessToken = params.get('accessToken');
    const refreshToken = params.get('refreshToken');
    if (!accessToken || !refreshToken) return null;

    let user = null;
    const userParam = params.get('user');
    try {
      if (userParam) user = JSON.parse(decodeURIComponent(userParam));
    } catch (_) {}

    return {
      accessToken,
      refreshToken,
      isNewUser: params.get('isNewUser') === '1',
      user: {
        ...user,
        id: user?.id || params.get('userId'),
        player_id: user?.player_id || params.get('playerId'),
      },
    };
  } catch {
    return null;
  }
}

export async function openSocialAuth(provider) {
  if (!STAGE_OAUTH_PROVIDERS.includes(provider)) {
    return { success: false, error: `Provider "${provider}" is not supported by Stage` };
  }

  const redirectUrl = getRedirectUrl();
  const authUrl = getSocialAuthUrl(provider, redirectUrl);

  try {
    // ASWebAuthenticationSession / Chrome Custom Tabs — stays in-app when
    // the server redirects to `redirectUrl` (stage:// or exp://).
    const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUrl, {
      preferEphemeralSession: false,
      showInRecents: false,
    });

    if (result.type === 'success' && result.url) {
      const parsed = parseOAuthCallbackUrl(result.url);
      if (parsed) {
        await useAuthStore.getState().setUserFromOAuth(
          parsed.accessToken,
          parsed.refreshToken,
          parsed.user
        );
        if (parsed.isNewUser && parsed.user?.id) {
          const { markNeedsOnboarding } = await import('../api/stageClient');
          markNeedsOnboarding(parsed.user.id);
        }
        return { success: true, isNewUser: Boolean(parsed.isNewUser) };
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
