import { localStorage } from './polyfillStorage';

export const LIVE_DARK_BG_STORAGE_KEY = 'stage-live-dark-bg';
export const LIVE_DARK_UPLOADS_KEY = 'stage-live-dark-uploads';
export const LIVE_DARK_FX_KEY = 'stage-live-dark-fx';
export const LIVE_DARK_MAX_UPLOADS = 3;
export const LIVE_DARK_BLUR_MIN = 0;
export const LIVE_DARK_BLUR_MAX = 16;
export const LIVE_DARK_OVERLAY_MIN = 0;
export const LIVE_DARK_OVERLAY_MAX = 0.85;

const trophiesBg = require('../assets/live-dark/trophies.jpg');
const wisBg = require('../assets/live-dark/wis.jpg');
const hiwBg = require('../assets/live-dark/hiw.jpg');

const FIXED_IMAGES = [trophiesBg, wisBg, hiwBg];
const FIXED_IDS = ['trophies', 'wis', 'hiw'];

export const LIVE_DARK_BG_OPTIONS = [
  { id: 'daily', labelKey: 'stgLiveDarkBgDaily', descKey: 'stgLiveDarkBgDailyDesc' },
  { id: 'trophies', labelKey: 'stgLiveDarkBgTrophies', src: trophiesBg },
  { id: 'wis', labelKey: 'stgLiveDarkBgWis', src: wisBg },
  { id: 'hiw', labelKey: 'stgLiveDarkBgHiw', src: hiwBg },
];

const DEFAULT_FX = { blur: 0, overlay: 0.18 };

function normalizeSlots(raw) {
  const slots = Array.from({ length: LIVE_DARK_MAX_UPLOADS }, () => '');
  if (!Array.isArray(raw)) return slots;
  for (let i = 0; i < LIVE_DARK_MAX_UPLOADS; i += 1) {
    if (typeof raw[i] === 'string' && raw[i]) slots[i] = raw[i];
  }
  return slots;
}

export function getLiveDarkBgPreference() {
  return localStorage.getItem(LIVE_DARK_BG_STORAGE_KEY) || 'daily';
}

export function setLiveDarkBgPreference(id) {
  const next = id || 'daily';
  localStorage.setItem(LIVE_DARK_BG_STORAGE_KEY, next);
  return next;
}

export function getLiveDarkUploadSlots() {
  try {
    return normalizeSlots(JSON.parse(localStorage.getItem(LIVE_DARK_UPLOADS_KEY) || '[]'));
  } catch {
    return normalizeSlots([]);
  }
}

function persistSlots(slots) {
  const next = normalizeSlots(slots);
  localStorage.setItem(LIVE_DARK_UPLOADS_KEY, JSON.stringify(next));
  return next;
}

export function filledUploadCount(slots = getLiveDarkUploadSlots()) {
  return slots.filter(Boolean).length;
}

export function addLiveDarkUpload(uri) {
  const slots = getLiveDarkUploadSlots();
  const index = slots.findIndex((slot) => !slot);
  if (index < 0) return { ok: false };
  slots[index] = uri;
  persistSlots(slots);
  return { ok: true, index };
}

export function replaceLiveDarkUpload(index, uri) {
  if (index < 0 || index >= LIVE_DARK_MAX_UPLOADS) return { ok: false };
  const slots = getLiveDarkUploadSlots();
  slots[index] = uri;
  persistSlots(slots);
  return { ok: true, index };
}

export function clearLiveDarkUpload(index) {
  const slots = getLiveDarkUploadSlots();
  if (index < 0 || index >= slots.length) return slots;
  slots[index] = '';
  persistSlots(slots);
  const current = getLiveDarkBgPreference();
  if (current === `custom-${index}`) setLiveDarkBgPreference('daily');
  return slots;
}

export function getLiveDarkFx() {
  try {
    const parsed = JSON.parse(localStorage.getItem(LIVE_DARK_FX_KEY) || '{}');
    return {
      blur: Number.isFinite(Number(parsed.blur)) ? Number(parsed.blur) : DEFAULT_FX.blur,
      overlay: Number.isFinite(Number(parsed.overlay)) ? Number(parsed.overlay) : DEFAULT_FX.overlay,
    };
  } catch {
    return { ...DEFAULT_FX };
  }
}

export function setLiveDarkFx(patch) {
  const next = { ...getLiveDarkFx(), ...patch };
  next.blur = Math.min(LIVE_DARK_BLUR_MAX, Math.max(LIVE_DARK_BLUR_MIN, Number(next.blur) || 0));
  next.overlay = Math.min(LIVE_DARK_OVERLAY_MAX, Math.max(LIVE_DARK_OVERLAY_MIN, Number(next.overlay) || 0));
  localStorage.setItem(LIVE_DARK_FX_KEY, JSON.stringify(next));
  return next;
}

function isCustomId(id) {
  return typeof id === 'string' && /^custom-\d+$/.test(id);
}

function customIndex(id) {
  const match = String(id).match(/^custom-(\d+)$/);
  return match ? Number(match[1]) : -1;
}

function dayIndex() {
  return Math.floor(Date.now() / 86_400_000);
}

export function getLiveDarkBackgroundUrl(preference = getLiveDarkBgPreference()) {
  if (isCustomId(preference)) {
    const src = getLiveDarkUploadSlots()[customIndex(preference)];
    if (src) return src;
  }
  if (preference && preference !== 'daily') {
    const fixed = LIVE_DARK_BG_OPTIONS.find((opt) => opt.id === preference && opt.src);
    if (fixed?.src) return fixed.src;
  }
  const pool = [...FIXED_IMAGES, ...getLiveDarkUploadSlots().filter(Boolean)];
  return pool[dayIndex() % Math.max(pool.length, 1)] || trophiesBg;
}

export function getLiveDarkImageSource(preference) {
  const src = getLiveDarkBackgroundUrl(preference);
  if (src == null) return null;
  if (typeof src === 'number' || (typeof src === 'object' && src)) return src;
  if (typeof src === 'string') return { uri: src };
  return src;
}
