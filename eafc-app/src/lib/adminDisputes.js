import { stageClient } from '@/api/stageClient';
import { canResolveDisputeWithScore } from '@/lib/gameDayResultFlow';
import { getStageOrigin } from '@/utils/stageConfig';

export function isStageAdmin(user) {
  return user?.role === 'admin' || [0, 2].includes(Number(user?.role_id));
}

export function parseSubmission(raw) {
  if (!raw) return null;
  if (typeof raw === 'object') return raw;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function absoluteProofUrl(url) {
  if (!url) return null;
  const value = String(url).trim();
  if (!value) return null;
  if (/^https?:\/\//i.test(value)) return value;
  const origin = getStageOrigin();
  return `${origin}${value.startsWith('/') ? value : `/${value}`}`;
}

export async function loadDisputedMatches() {
  return stageClient.entities.Match.filter({ status: 'disputed' }, '-updated_date', 50).catch(() => []);
}

export async function loadCompletedMatchesWithProofs() {
  return stageClient.entities.Match.filter({ status: 'completed' }, '-updated_date', 30).catch(() => []);
}

export async function resolveDisputedMatch({
  matchId,
  winnerSide,
  homeScore,
  awayScore,
}) {
  if (!canResolveDisputeWithScore(winnerSide, { home_score: homeScore, away_score: awayScore })) {
    throw new Error('Pick a side and enter the official score');
  }
  return stageClient.functions.invoke('matchKickoff', {
    match_id: matchId,
    action: 'admin_resolve',
    admin_resolve_winner: winnerSide,
    admin_home_score: Number(homeScore),
    admin_away_score: Number(awayScore),
  });
}
