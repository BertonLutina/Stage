import { parseKickoffDate } from '@/lib/momentDate';

export function clubInitials(name, fallback = '?') {
  const trimmed = String(name || '').trim();
  if (!trimmed) return fallback;
  const parts = trimmed.split(/[\s._-]+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  const compact = trimmed.replace(/[^A-Za-z0-9]/g, '');
  return (compact.slice(0, 3) || fallback).toUpperCase();
}

export function pad2(value) {
  return String(Math.max(0, Number(value) || 0)).padStart(2, '0');
}

export function getKickoffCountdownParts(scheduledDate, now = new Date()) {
  if (!scheduledDate) return null;
  const date = scheduledDate instanceof Date ? scheduledDate : parseKickoffDate(scheduledDate);
  if (Number.isNaN(date.getTime())) return null;
  const ms = date.getTime() - now.getTime();
  if (ms <= 0) {
    return { hours: 0, minutes: 0, seconds: 0, totalMs: ms, started: true };
  }
  const totalSeconds = Math.floor(ms / 1000);
  return {
    hours: Math.floor(totalSeconds / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
    totalMs: ms,
    started: false,
  };
}

export function formatBroadcastUnit(value) {
  if (value >= 100) return String(value);
  return pad2(value);
}

const HIDDEN_GAME_DAY_STATUSES = new Set(['forfeit', 'cancelled', 'canceled', 'deleted']);
const GAME_DAY_COMPLETED_MS = 24 * 60 * 60 * 1000;

export function isActiveGameDayMatch(match, now = Date.now()) {
  if (!match?.id) return false;
  const status = String(match.status || '').toLowerCase();
  if (HIDDEN_GAME_DAY_STATUSES.has(status)) return false;
  if (status === 'completed') {
    const updatedAt = match.updated_date ? new Date(match.updated_date) : null;
    if (!updatedAt || Number.isNaN(updatedAt.getTime())) return false;
    return now - updatedAt.getTime() < GAME_DAY_COMPLETED_MS;
  }
  return true;
}

/** Scale Match Details crests/type to the panel width so phones do not overflow. */
export function gameDayArenaLayout(panelWidth, { compact: forceCompact } = {}) {
  const w = Math.max(240, Number(panelWidth) || 360);
  const compact = forceCompact === true || (forceCompact !== false && w < 420);
  const padH = compact ? 12 : 16;
  const vsW = compact ? 52 : 68;
  const vsH = compact ? 40 : 52;
  const vsCol = vsW + 8;
  const sideBudget = Math.max(64, Math.floor((w - padH * 2 - vsCol) / 2));
  const crest = Math.min(compact ? 108 : 152, sideBudget);
  return {
    compact,
    padH,
    padTop: compact ? 14 : 20,
    padBottom: compact ? 14 : 20,
    crest,
    vsW,
    vsH,
    nameSize: Math.max(12, Math.min(18, Math.round(crest * 0.125))),
    clockSize: compact ? 26 : 34,
    clockGap: compact ? 14 : 28,
    circle: Math.min(200, Math.round(w * 0.46)),
    matchupMt: compact ? 12 : 20,
  };
}

export function resolveCrestUrl(game, side, myClub, myPlayer) {
  if (!game) return null;
  const isHome = side === 'home';
  if (game.mode === 'solo' || (!game.home_club_id && game.home_player_id)) {
    if (isHome && myPlayer && String(myPlayer.id) === String(game.home_player_id)) {
      return myPlayer.avatar_url || null;
    }
    if (!isHome && myPlayer && String(myPlayer.id) === String(game.away_player_id)) {
      return myPlayer.avatar_url || null;
    }
    return null;
  }
  const clubId = isHome ? game.home_club_id : game.away_club_id;
  if (myClub && String(myClub.id) === String(clubId)) return myClub.logo_url || null;
  return null;
}
