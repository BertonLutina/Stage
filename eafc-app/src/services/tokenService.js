const TOKEN_KEY = 'eafc_access_token';
const REFRESH_KEY = 'eafc_refresh_token';

let memCache = {};

async function getStorage() {
  try {
    const SecureStore = require('expo-secure-store');
    return {
      get: SecureStore.getItemAsync,
      set: SecureStore.setItemAsync,
      del: SecureStore.deleteItemAsync,
    };
  } catch {
    // Fallback to AsyncStorage so tokens persist across reloads
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      return {
        get: async (k) => AsyncStorage.getItem(k),
        set: async (k, v) => AsyncStorage.setItem(k, v),
        del: async (k) => AsyncStorage.removeItem(k),
      };
    } catch {
      // Last resort: in-memory only (non-persistent)
      return {
        get: async (k) => memCache[k] || null,
        set: async (k, v) => { memCache[k] = v; },
        del: async (k) => { delete memCache[k]; },
      };
    }
  }
}

export async function getAccessToken() {
  const s = await getStorage();
  return s.get(TOKEN_KEY);
}

export async function getRefreshToken() {
  const s = await getStorage();
  return s.get(REFRESH_KEY);
}

export async function setTokens(accessToken, refreshToken) {
  const s = await getStorage();
  await s.set(TOKEN_KEY, accessToken);
  if (refreshToken) await s.set(REFRESH_KEY, refreshToken);
}

export async function clearTokens() {
  const s = await getStorage();
  await s.del(TOKEN_KEY);
  await s.del(REFRESH_KEY);
}
