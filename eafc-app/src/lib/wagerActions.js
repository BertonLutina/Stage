import { stageClient } from '@/api/stageClient';

export const WAGER_STATUS_LABEL = {
  pending_acceptance: 'Awaiting acceptance',
  active: 'Funds locked',
  settling: 'Settling',
  settled: 'Settled',
  refunded: 'Draw — refunded',
  declined: 'Declined',
  cancelled: 'Cancelled',
};

export function formatStc(value) {
  const v = Number(value || 0);
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(0)}K`;
  return v.toLocaleString();
}

export async function invokeWagerAction(action, matchId, extra = {}) {
  return stageClient.functions.invoke('wagerMatchActions', {
    action,
    match_id: matchId,
    ...extra,
  });
}

export function applyWagerOptimistic(game, action) {
  if (action === 'accept_wager') return { ...game, wager_away_locked: true, wager_status: 'active' };
  if (action === 'decline_wager') return { ...game, wager_status: 'declined', wager_stc: 0 };
  if (action === 'cancel_wager') return { ...game, wager_status: 'cancelled', wager_stc: 0 };
  return game;
}
