import { resolveMyPlayerAndClub, stageClient } from '@/api/stageClient';

/**
 * Lifestyle (task 12): catalogue (`lifestyle-items`), my assets (`lifestyle-purchases`),
 * balance (`playerWallet get_balance`), and the server functions that move STC:
 * buy / rent / invest / sell / collect. Prices and rules always come from the server rows.
 */

const DAY_MS = 86400000;
const HIDDEN_STATUSES = new Set(['sold', 'collected']);

function unwrap(result) {
  if (!result || typeof result !== 'object') return {};
  return result.data && typeof result.data === 'object' ? result.data : result;
}

const num = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

export async function loadLifestyleScreen() {
  const { player } = await resolveMyPlayerAndClub().catch(() => ({ player: null }));
  const [items, owned, wallet] = await Promise.all([
    stageClient.entities.LifestyleItem.filter({ is_active: true }, 'sort_order', 200),
    player?.id
      ? stageClient.entities.LifestylePurchase.filter({ player_id: player.id }, '-created_date', 500).catch(() => [])
      : Promise.resolve([]),
    player?.id
      ? stageClient.functions.invoke('playerWallet', { action: 'get_balance' }).catch(() => null)
      : Promise.resolve(null),
  ]);
  const balanceData = unwrap(wallet);
  const balance = balanceData.balance ?? player?.stc ?? null;
  return {
    player,
    balance: balance == null ? null : num(balance),
    items: Array.isArray(items) ? items : [],
    purchases: (Array.isArray(owned) ? owned : []).filter((row) => !HIDDEN_STATUSES.has(String(row.status || '').toLowerCase())),
  };
}

/** What the shop can do with an item right now: the price of each action, or null when not offered. */
export function shopOffers(item = {}) {
  const buy = item.can_buy !== 0 && item.can_buy !== false ? num(item.price_stc) : 0;
  const rent = item.can_rent ? num(item.rent_price_stc) : 0;
  const invest = item.can_invest ? num(item.invest_price_stc || item.price_stc) : 0;
  return { buy: buy > 0 ? buy : null, rent: rent > 0 ? rent : null, invest: invest > 0 ? invest : null };
}

export function filterShop(items = [], filter = 'all') {
  if (filter === 'all') return items;
  return items.filter((item) => shopOffers(item)[filter] != null);
}

const collectedAt = (purchase) => purchase.last_passive_collected_at || purchase.last_passive_collected || null;

/** Passive income from owned assets: what is collectable now, and when the next one lands. */
export function passiveIncomeStatus(purchases = [], items = [], now = Date.now()) {
  const byId = new Map(items.map((item) => [item.id, item]));
  let readyAmount = 0;
  let readyCount = 0;
  let nextAt = null;
  let hasIncome = false;
  purchases.forEach((purchase) => {
    if (purchase.purchase_type !== 'buy' || String(purchase.status || '').toLowerCase() !== 'active') return;
    const item = byId.get(purchase.item_id);
    const income = num(item?.passive_income_stc);
    if (income <= 0) return;
    hasIncome = true;
    const interval = (num(item.passive_income_interval_days) || 7) * DAY_MS;
    const since = Date.parse(collectedAt(purchase) || purchase.created_date || 0) || 0;
    const due = since + interval;
    if (now >= due) {
      readyAmount += income;
      readyCount += 1;
    } else if (!nextAt || due < nextAt.getTime()) {
      nextAt = new Date(due);
    }
  });
  return { hasIncome, readyAmount, readyCount, nextAt };
}

/** Display facts for one of my assets. */
export function describeAsset(purchase = {}, item = null, now = Date.now()) {
  const type = purchase.purchase_type;
  const kind = type === 'rent' ? 'rented' : type === 'invest' ? 'invest' : 'owned';
  const sellPercent = num(item?.sell_value_percent) || 60;
  const paid = num(purchase.price_paid_stc) || num(item?.price_stc);
  const canSell = kind === 'owned' && Boolean(item) && Boolean(item.can_sell);
  const endRaw = kind === 'rented' ? purchase.rent_end_date : kind === 'invest' ? purchase.invest_end_date : null;
  const endsAt = endRaw ? new Date(endRaw) : null;
  const validEnd = endsAt && !Number.isNaN(endsAt.getTime()) ? endsAt : null;
  return {
    kind,
    canSell,
    sellPercent,
    sellPrice: canSell ? Math.floor((paid * sellPercent) / 100) : null,
    endsAt: validEnd,
    matured: kind === 'invest' ? !validEnd || validEnd.getTime() <= now : false,
    payout: kind === 'invest' ? paid + num(purchase.invest_return_amount) : null,
    weeklyMaintenance: num(purchase.weekly_maintenance_stc) || num(item?.weekly_maintenance_stc) || null,
  };
}

const call = async (name, params) => unwrap(await stageClient.functions.invoke(name, params));

export const buyItem = (itemId) => call('buyLifestyleItem', { item_id: itemId });
export const rentItem = (itemId) => call('rentLifestyleItem', { item_id: itemId });
export const investInItem = (itemId) => call('investInLifestyleItem', { item_id: itemId });
export const sellAsset = (purchaseId) => call('sellLifestyleAsset', { purchase_id: purchaseId });
export const collectInvestment = (purchaseId) => call('collectInvestmentReturn', { purchase_id: purchaseId });
export const collectPassiveIncome = () => call('collectPassiveIncome', {});
