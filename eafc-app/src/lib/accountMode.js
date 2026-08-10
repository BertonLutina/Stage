import { localStorage } from './polyfillStorage';

export const ACCOUNT_MODE_KEY = 'stage-account-mode';

const VALID_MODES = new Set(['player', 'club']);

function normalizeAccountMode(mode) {
  return VALID_MODES.has(mode) ? mode : 'player';
}

export function readAccountMode() {
  try {
    return normalizeAccountMode(localStorage.getItem(ACCOUNT_MODE_KEY));
  } catch {
    return 'player';
  }
}

export function writeAccountMode(mode) {
  try {
    localStorage.setItem(ACCOUNT_MODE_KEY, normalizeAccountMode(mode));
  } catch {
    /* ignore */
  }
}

export function clearAccountMode() {
  try {
    localStorage.removeItem(ACCOUNT_MODE_KEY);
  } catch {
    /* ignore */
  }
}
