import { create } from 'zustand';
import { stageClient, storeTokens as stageStoreTokens } from '../api/stageClient';
import { hydrateStageStorage } from '../lib/polyfillStorage';
import { setTokens, clearTokens, getAccessToken } from '../services/tokenService';

function mapStageUser(me) {
  if (!me) return null;
  const tag = me.gamertag || me.gamer_tag || null;
  const base = String(tag || me.email?.split('@')[0] || 'Player');
  const parts = base.split(/[\s._-]+/).filter(Boolean);
  return {
    ...me,
    id: me.id,
    email: me.email,
    gamer_tag: tag,
    gamertag: tag,
    first_name: me.first_name || parts[0] || base,
    last_name: me.last_name || parts.slice(1).join(' ') || '',
    avatar: me.avatar_url || me.avatar || null,
    team_id: me.club_id || me.owned_club_id || me.president_club_id || null,
    player_id: me.player_id || null,
  };
}

function loginErrorMessage(err) {
  if (err?.message === 'Request timed out. Please check your connection and try again.') {
    return err.message;
  }
  if (err?.message) return String(err.message);
  if (err?.error) return String(err.error);
  if (typeof err === 'string') return err;
  // Network / fetch failure (no HTTP response)
  if (err?.name === 'TypeError' || err?.message?.includes?.('Network')) {
    return 'Connection failed. Check network and that the Stage server is running.';
  }
  if (!err?.status) {
    return 'Connection failed. Check network and that the Stage server is running.';
  }
  return 'Login failed';
}

const useAuthStore = create((set) => ({
  user: null,
  loading: false,
  error: null,

  initialize: async () => {
    try {
      await hydrateStageStorage();
      const token = await getAccessToken();
      const stageTok = globalThis.localStorage?.getItem?.('stage_access_token');
      if (!token && !stageTok) return;
      const me = await stageClient.auth.me();
      set({ user: mapStageUser(me) });
    } catch (err) {
      const status = err?.status || err?.response?.status;
      if (status === 401 || status === 403) {
        await clearTokens();
        try { await stageClient.auth.logout?.(); } catch { /* ignore */ }
        set({ user: null });
      }
    }
  },

  login: async (identifier, password) => {
    set({ loading: true, error: null });
    try {
      await hydrateStageStorage();
      const id = String(identifier || '').trim();
      if (!id || !password) {
        set({ error: 'Email/gamer tag and password are required', loading: false });
        return false;
      }
      await stageClient.auth.loginViaEmailPassword(id, password);
      const me = await stageClient.auth.me();
      set({ user: mapStageUser(me), loading: false, error: null });
      return true;
    } catch (err) {
      set({ error: loginErrorMessage(err), loading: false });
      return false;
    }
  },

  register: async (payload) => {
    set({ loading: true, error: null });
    try {
      await hydrateStageStorage();
      const email = payload.email;
      const password = payload.password;
      await stageClient.auth.registerViaEmailPassword({ email, password });
      if (payload.gamer_tag || payload.gamertag || payload.position || payload.platform) {
        try {
          const me = await stageClient.auth.me();
          if (me?.player_id) {
            await stageClient.entities.Player.update(me.player_id, {
              gamertag: payload.gamer_tag || payload.gamertag || undefined,
              position: payload.position || undefined,
              platform: payload.platform || undefined,
            });
          } else {
            await stageClient.entities.Player.create({
              email,
              gamertag: payload.gamer_tag || payload.gamertag || email.split('@')[0],
              position: payload.position || null,
              platform: payload.platform || null,
              user_id: me?.id,
            });
          }
        } catch {
          /* profile enrichment non-fatal */
        }
      }
      const me = await stageClient.auth.me();
      set({ user: mapStageUser(me), loading: false, error: null });
      return true;
    } catch (err) {
      set({
        error: err?.message || err?.error || 'Register failed',
        loading: false,
      });
      return false;
    }
  },

  logout: async () => {
    try {
      stageClient.auth.logout();
    } catch {
      await clearTokens();
    }
    set({ user: null, error: null });
  },

  setUserFromOAuth: async (accessToken, refreshToken, user) => {
    await stageStoreTokens({ accessToken, refreshToken, userId: user?.id });
    await setTokens(accessToken, refreshToken);
    if (user) {
      set({ user: mapStageUser(user), error: null });
      return true;
    }
    try {
      const me = await stageClient.auth.me();
      set({ user: mapStageUser(me), error: null });
      return true;
    } catch {
      set({ user: user || null });
      return Boolean(user);
    }
  },

  clearError: () => set({ error: null }),
  updateUser: (user) => set({ user }),
}));

export default useAuthStore;
