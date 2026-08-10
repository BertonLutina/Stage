/**
 * Stage League translations for eafc-app.
 * Prefer getCoreTranslations(lang) — merges packs + admin extras.
 */
export { getCoreTranslations, settingsPageEn } from './coreTranslations.js';
export { getAdminTranslations, adminTranslations } from './adminTranslations.js';
export { EXTENDED_LANGUAGE_NAMES } from './additionalLocales.js';

import { getCoreTranslations } from './coreTranslations.js';

/** Simple t(key) helper: dotted path into core translations for current language. */
export function createTranslator(language = 'en') {
  const dict = getCoreTranslations(language) || getCoreTranslations('en') || {};
  return function t(path, fallback = path) {
    const parts = String(path).split('.');
    let cur = dict;
    for (const p of parts) {
      if (cur == null || typeof cur !== 'object') return fallback;
      cur = cur[p];
    }
    return cur == null ? fallback : cur;
  };
}
