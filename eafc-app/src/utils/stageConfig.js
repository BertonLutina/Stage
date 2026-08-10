/**
 * Shared Stage API base URLs for Expo.
 */
export function getStageApiBase() {
  const explicit = process.env.EXPO_PUBLIC_STAGE_API_URL || process.env.EXPO_PUBLIC_API_BASE;
  if (explicit) return explicit.replace(/\/$/, '');
  const mobile = process.env.EXPO_PUBLIC_API_URL || '';
  if (mobile.includes('/api/mobile')) {
    return mobile.replace(/\/api\/mobile\/?$/, '/api/stage');
  }
  if (mobile.includes('/api/stage')) return mobile.replace(/\/$/, '');
  if (mobile) return `${mobile.replace(/\/$/, '')}/api/stage`;
  return 'https://stageleagues.com/api/stage';
}

export function getStageOrigin() {
  return getStageApiBase().replace(/\/api\/stage\/?$/, '') || 'https://stageleagues.com';
}
