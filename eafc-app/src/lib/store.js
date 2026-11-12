import { entityHasStagePlus } from '@/lib/subscriptionUtils';
import {
  CREDIT_PACKS, STAGE_PLUS_MONTHLY_CREDITS, STAGE_PLUS_PRICE, loadStore,
} from '@/lib/stageDirectories';

/** `{ user, player, club, config, credits, stc }` (the real store payload). */
export function loadStoreScreen() {
  return loadStore();
}

export function creditPacks() {
  return CREDIT_PACKS;
}

export function plusPrices(config) {
  const monthly = Number(config?.stage_plus_monthly_price);
  const yearly = Number(config?.stage_plus_yearly_price);
  return {
    monthly: monthly > 0 ? monthly : STAGE_PLUS_PRICE.monthly,
    yearly: yearly > 0 ? yearly : STAGE_PLUS_PRICE.yearly,
  };
}

export function plusMonthlyCredits(config) {
  const value = Number(config?.monthly_credits);
  return value > 0 ? value : STAGE_PLUS_MONTHLY_CREDITS;
}

/** Perks written in the store settings (array or JSON string). */
export function parsePerks(config) {
  let perks = config?.perks;
  if (typeof perks === 'string') {
    try { perks = JSON.parse(perks); } catch { perks = []; }
  }
  if (!Array.isArray(perks)) return [];
  return perks.map((p) => String(p || '').trim()).filter(Boolean);
}

/**
 * Where the player stands with STAGE Plus.
 * `inactive` · `active` (renews on `renewsAt`) · `ending` (renewal off, ends on `renewsAt`).
 */
export function describePlus({ player }) {
  if (!player || !entityHasStagePlus(player)) return { state: 'inactive', renewsAt: null };
  const parsed = player.subscription_expires_at ? new Date(player.subscription_expires_at) : null;
  const renewsAt = parsed && !Number.isNaN(parsed.getTime()) ? parsed : null;
  const ending = Number(player.subscription_cancel_at_period_end) === 1;
  return { state: ending ? 'ending' : 'active', renewsAt };
}

export function formatPlusDate(value, language = 'en') {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-GB', {
    day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC',
  });
}

/** Maps a checkout outcome to a notice: `{ tone: success|neutral|pending, key, params }`. */
export function outcomeNotice(outcome, kind, pack) {
  const status = outcome?.status;
  if (status === 'activated') {
    if (kind === 'plus') return { tone: 'success', key: 'plusActivated', params: {} };
    const credits = Number(outcome?.data?.credits_added) || Number(pack?.credits) || 0;
    return credits > 0
      ? { tone: 'success', key: 'creditsAdded', params: { credits } }
      : { tone: 'success', key: 'creditsAddedGeneric', params: {} };
  }
  if (status === 'cancelled') return { tone: 'neutral', key: 'paymentCancelled', params: {} };
  return { tone: 'pending', key: 'paymentPending', params: {} };
}
