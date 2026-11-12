import { useMemo } from 'react';
import { localStorage } from '@/lib/polyfillStorage';
import { createTranslator } from '@/translations';

const LANGUAGE_KEY = 'language';

export function getStoredLanguage() {
  try {
    return localStorage.getItem(LANGUAGE_KEY) || 'en';
  } catch {
    return 'en';
  }
}

/** `t('stage.hub.rankings')`, with `{name}` interpolation: `t('stage.x', { name: 'A' })`. */
export function makeT(language = 'en') {
  const translate = createTranslator(language);
  return function t(key, vars) {
    const raw = translate(key, key);
    const text = typeof raw === 'string' ? raw : key;
    if (!vars) return text;
    return text.replace(/\{(\w+)\}/g, (match, name) => (vars[name] == null ? match : String(vars[name])));
  };
}

export default function useT() {
  const language = getStoredLanguage();
  return useMemo(() => makeT(language), [language]);
}
