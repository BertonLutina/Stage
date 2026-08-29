export const SUBSCRIPTION_TIERS = {
  free: 'free',
  stage_plus: 'stage_plus',
};

export function normalizeSubscriptionTier(tier) {
  const normalized = String(tier || '').toLowerCase();
  if (['stage_plus', 'plus', 'pro', 'elite'].includes(normalized)) {
    return SUBSCRIPTION_TIERS.stage_plus;
  }
  return SUBSCRIPTION_TIERS.free;
}

export function hasStagePlus(tier, expiresAt) {
  if (normalizeSubscriptionTier(tier) !== SUBSCRIPTION_TIERS.stage_plus) return false;
  if (!expiresAt) return true;
  const expires = new Date(expiresAt);
  if (Number.isNaN(expires.getTime())) return true;
  return expires.getTime() > Date.now();
}

/** Prefer this when you have the player/user row, not just the tier string. */
export function entityHasStagePlus(entity) {
  if (!entity || typeof entity !== 'object') return hasStagePlus(entity);
  return hasStagePlus(entity.subscription, entity.subscription_expires_at);
}
