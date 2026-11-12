import { localStorage } from './polyfillStorage';

/**
 * Auth-only wallpaper system (Welcome / Sign in / Sign up).
 * Photos from `backgroundImages/` (copied into src/assets/auth-bg/).
 * Independent from Live Dark — own storage keys, blur, blue overlay, reset.
 */

export const AUTH_BG_STORAGE_KEY = 'stage-auth-bg';
export const AUTH_BG_FX_KEY = 'stage-auth-bg-fx';

export const AUTH_BG_BLUR_MIN = 0;
export const AUTH_BG_BLUR_MAX = 16;
export const AUTH_BG_OVERLAY_MIN = 0;
export const AUTH_BG_OVERLAY_MAX = 0.85;

/** Stage gradient option (no photo). */
export const AUTH_BG_GRADIENT_ID = 'default';
/** Starting photo: Neymar. Also what Reset restores. */
export const AUTH_BG_DEFAULT_ID = 'neymar';

const DEFAULT_FX = { blur: 4, overlay: 0.45 };

const neymar = require('../assets/auth-bg/neymar.jpg');
const penalty = require('../assets/auth-bg/penalty.png');
const screamer = require('../assets/auth-bg/screamer.png');
const winners = require('../assets/auth-bg/winners.png');
const losergame = require('../assets/auth-bg/losergame.png');
const score = require('../assets/auth-bg/score.png');
const slide = require('../assets/auth-bg/slide.png');
const team = require('../assets/auth-bg/team.jpg');
const longuevie = require('../assets/auth-bg/longuevie.jpg');
const stadium = require('../assets/auth-bg/stadium.jpg');

/** Bundled auth photos the user can pick in Appearance. */
export const AUTH_BG_OPTIONS = [
  { id: AUTH_BG_GRADIENT_ID, labelKey: 'default', src: null },
  { id: 'neymar', labelKey: 'neymar', src: neymar },
  { id: 'penalty', labelKey: 'penalty', src: penalty },
  { id: 'screamer', labelKey: 'screamer', src: screamer },
  { id: 'winners', labelKey: 'winners', src: winners },
  { id: 'losergame', labelKey: 'losergame', src: losergame },
  { id: 'score', labelKey: 'score', src: score },
  { id: 'slide', labelKey: 'slide', src: slide },
  { id: 'team', labelKey: 'team', src: team },
  { id: 'longuevie', labelKey: 'longuevie', src: longuevie },
  { id: 'stadium', labelKey: 'stadium', src: stadium },
];

const OPTION_IDS = new Set(AUTH_BG_OPTIONS.map((o) => o.id));

function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}

export function getAuthBgPreference() {
  const id = localStorage.getItem(AUTH_BG_STORAGE_KEY);
  return OPTION_IDS.has(id) ? id : AUTH_BG_DEFAULT_ID;
}

export function setAuthBgPreference(id) {
  const next = OPTION_IDS.has(id) ? id : AUTH_BG_DEFAULT_ID;
  localStorage.setItem(AUTH_BG_STORAGE_KEY, next);
  return next;
}

export function getAuthBgFx() {
  try {
    const parsed = JSON.parse(localStorage.getItem(AUTH_BG_FX_KEY) || '{}');
    return {
      blur: Number.isFinite(Number(parsed.blur)) ? Number(parsed.blur) : DEFAULT_FX.blur,
      overlay: Number.isFinite(Number(parsed.overlay)) ? Number(parsed.overlay) : DEFAULT_FX.overlay,
    };
  } catch {
    return { ...DEFAULT_FX };
  }
}

export function setAuthBgFx(patch) {
  const next = { ...getAuthBgFx(), ...patch };
  next.blur = clamp(Number(next.blur) || 0, AUTH_BG_BLUR_MIN, AUTH_BG_BLUR_MAX);
  next.overlay = clamp(Number(next.overlay) || 0, AUTH_BG_OVERLAY_MIN, AUTH_BG_OVERLAY_MAX);
  localStorage.setItem(AUTH_BG_FX_KEY, JSON.stringify(next));
  return next;
}

/** Back to Neymar + default blur/overlay. */
export function resetAuthBackground() {
  localStorage.removeItem(AUTH_BG_STORAGE_KEY);
  localStorage.removeItem(AUTH_BG_FX_KEY);
  return {
    preference: AUTH_BG_DEFAULT_ID,
    fx: { ...DEFAULT_FX },
  };
}

export function getAuthBgImageSource(preference = getAuthBgPreference()) {
  const opt = AUTH_BG_OPTIONS.find((o) => o.id === preference && o.src);
  return opt?.src || null;
}

export function isAuthBgPhotoActive(preference = getAuthBgPreference()) {
  return preference !== AUTH_BG_GRADIENT_ID && Boolean(getAuthBgImageSource(preference));
}

export function getAuthBackgroundState() {
  const preference = getAuthBgPreference();
  return {
    preference,
    fx: getAuthBgFx(),
    source: getAuthBgImageSource(preference),
    active: isAuthBgPhotoActive(preference),
  };
}
