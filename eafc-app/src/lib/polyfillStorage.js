/**
 * Sync in-memory storage with AsyncStorage persistence.
 * stageClient expects localStorage/sessionStorage sync APIs.
 */

const mem = Object.create(null);
const sessionMem = Object.create(null);
let hydrated = false;
let hydratePromise = null;

function makeStorage(store) {
  return {
    getItem(key) {
      const k = String(key);
      return Object.prototype.hasOwnProperty.call(store, k) ? store[k] : null;
    },
    setItem(key, value) {
      store[String(key)] = String(value);
      schedulePersist();
    },
    removeItem(key) {
      delete store[String(key)];
      schedulePersist();
    },
    clear() {
      Object.keys(store).forEach((k) => delete store[k]);
      schedulePersist();
    },
    key(i) {
      return Object.keys(store)[i] ?? null;
    },
    get length() {
      return Object.keys(store).length;
    },
  };
}

let persistTimer = null;
function schedulePersist() {
  if (persistTimer) return;
  persistTimer = setTimeout(() => {
    persistTimer = null;
    persist().catch(() => {});
  }, 50);
}

async function getAsyncStorage() {
  try {
    return require('@react-native-async-storage/async-storage').default;
  } catch {
    return null;
  }
}

const PERSIST_KEY = '@stage_rn_storage_v1';

export async function hydrateStageStorage() {
  if (hydrated) return;
  if (hydratePromise) return hydratePromise;
  hydratePromise = (async () => {
    const AsyncStorage = await getAsyncStorage();
    if (AsyncStorage) {
      try {
        const raw = await AsyncStorage.getItem(PERSIST_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          Object.assign(mem, parsed?.local || {});
          Object.assign(sessionMem, parsed?.session || {});
        }
      } catch {
        /* ignore */
      }
    }
    hydrated = true;
  })();
  return hydratePromise;
}

async function persist() {
  const AsyncStorage = await getAsyncStorage();
  if (!AsyncStorage) return;
  try {
    await AsyncStorage.setItem(
      PERSIST_KEY,
      JSON.stringify({ local: { ...mem }, session: { ...sessionMem } })
    );
  } catch {
    /* ignore */
  }
}

export const localStorage = makeStorage(mem);
export const sessionStorage = makeStorage(sessionMem);

export function installStoragePolyfill() {
  const g = globalThis;
  if (!g.localStorage) g.localStorage = localStorage;
  if (!g.sessionStorage) g.sessionStorage = sessionStorage;
  if (!g.window) {
    g.window = g;
  }
  if (typeof g.window.dispatchEvent !== 'function') {
    g.window.dispatchEvent = () => true;
  }
  if (typeof g.window.addEventListener !== 'function') {
    g.window.addEventListener = () => {};
    g.window.removeEventListener = () => {};
  }
  // Hermes has no DOM Event / CustomEvent — stageClient.notifyAuthChanged needs this.
  if (typeof g.Event !== 'function') {
    g.Event = function Event(type) {
      this.type = type;
    };
  }
  if (typeof g.CustomEvent !== 'function') {
    g.CustomEvent = function CustomEvent(type, params) {
      this.type = type;
      this.detail = params?.detail;
    };
  }
  if (!g.window.location) {
    g.window.location = { href: '', origin: '', pathname: '/', search: '', hash: '' };
  }
  if (!g.window.history) {
    g.window.history = { replaceState() {} };
  }
}

installStoragePolyfill();
