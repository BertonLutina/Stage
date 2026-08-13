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

export function hasStagePlus(tier) {
  return normalizeSubscriptionTier(tier) === SUBSCRIPTION_TIERS.stage_plus;
}
