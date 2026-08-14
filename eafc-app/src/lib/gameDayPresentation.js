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
  const date = scheduledDate instanceof Date ? scheduledDate : new Date(scheduledDate);
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
