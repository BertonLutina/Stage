import { stageClient } from '@/api/stageClient';
import { syncPlayerCareerStats } from '@/lib/gameDayIntegration';

export function parseIdList(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function countSeated(raw) {
  return parseIdList(raw).length;
}

export function minutesUntil(dateValue) {
  if (!dateValue) return null;
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return null;
  return Math.round((date.getTime() - Date.now()) / 60000);
}

export function sameId(a, b) {
  if (a == null || b == null || a === '' || b === '') return false;
  return String(a) === String(b);
}

export function isClubGameDayMatch(game) {
  if (game?.mode === 'club') return true;
  if (game?.mode === 'solo') return false;
  return Boolean(game?.home_club_id || game?.away_club_id);
}

export function resolveMatchSides(game, myClub, myPlayer) {
  const isClubMatch = isClubGameDayMatch(game);
  const isSoloMatch = game?.mode === 'solo' || (!isClubMatch && Boolean(game?.home_player_id));
  const homeName = isClubMatch ? (game?.home_club_name || 'Home') : (game?.home_player_name || 'Home');
  const awayName = isClubMatch ? (game?.away_club_name || 'Away') : (game?.away_player_name || 'Away');
  const isMyMatch = isClubMatch
    ? Boolean(myClub && (sameId(game?.home_club_id, myClub.id) || sameId(game?.away_club_id, myClub.id)))
    : Boolean(myPlayer && (sameId(game?.home_player_id, myPlayer.id) || sameId(game?.away_player_id, myPlayer.id)));
  const amIHomeTeam = isClubMatch
    ? Boolean(myClub && sameId(game?.home_club_id, myClub.id))
    : Boolean(myPlayer && sameId(game?.home_player_id, myPlayer.id));
  return { isClubMatch, isSoloMatch, homeName, awayName, isMyMatch, amIHomeTeam };
}

export function canKickoffMatch(game) {
  if (game?.status !== 'scheduled') return false;
  const mins = minutesUntil(game.scheduled_date);
  return mins == null ? true : mins <= 15;
}

export function canAccessPressRoom(game) {
  const mins = minutesUntil(game?.scheduled_date);
  return (game?.status === 'scheduled' && mins != null && mins <= 120)
    || game?.status === 'in_progress';
}

export function bothDressingRoomsReady(isClubMatch, counts) {
  if (!isClubMatch) return true;
  return Number(counts?.home || 0) > 0 && Number(counts?.away || 0) > 0;
}

export async function loadDressingCounts(game) {
  if (!game?.id || !isClubGameDayMatch(game)) return { home: 0, away: 0 };
  const rows = await stageClient.entities.DressingRoom.filter({ match_id: game.id }, null, 10).catch(() => []);
  const next = { home: 0, away: 0 };
  for (const row of rows || []) {
    const seated = countSeated(row.seated_players);
    if (String(row.club_id) === String(game.home_club_id)) next.home = seated;
    else if (String(row.club_id) === String(game.away_club_id)) next.away = seated;
  }
  return next;
}

export async function kickoffMatch(matchId) {
  return stageClient.functions.invoke('matchKickoff', {
    match_id: matchId,
    action: 'kickoff',
  });
}

export function toFixtureScores(isHomeTeam, ownScore, opponentScore) {
  const own = Number(ownScore);
  const opponent = Number(opponentScore);
  return isHomeTeam
    ? { home_score: own, away_score: opponent, own_score: own, opponent_score: opponent }
    : { home_score: opponent, away_score: own, own_score: own, opponent_score: opponent };
}

export function buildResultPayload({
  game,
  isHomeTeam,
  myClub,
  myPlayer,
  homeScore,
  awayScore,
  ownScore,
  opponentScore,
  seatedPlayers = [],
  ratings = {},
  goalEvents = [],
  proofUrl,
}) {
  const isClubMatch = isClubGameDayMatch(game);
  const derived = {};
  seatedPlayers.forEach((p) => { derived[p.id] = { goals: 0, assists: 0 }; });
  goalEvents.forEach((ev) => {
    if (ev.scorer_player_id && derived[ev.scorer_player_id]) derived[ev.scorer_player_id].goals += 1;
    if (ev.assist_player_id && derived[ev.assist_player_id]) derived[ev.assist_player_id].assists += 1;
  });

  let playerStats = [];
  if (isClubMatch) {
    playerStats = seatedPlayers.map((p) => ({
      player_id: p.id,
      player_email: p.email,
      player_gamertag: p.gamertag,
      club_id: myClub?.id || null,
      goals: derived[p.id]?.goals || 0,
      assists: derived[p.id]?.assists || 0,
      rating: Number(ratings[p.id] || 6),
    }));
  } else if (myPlayer) {
    playerStats = [{
      player_id: myPlayer.id,
      player_email: myPlayer.email,
      player_gamertag: myPlayer.gamertag,
      club_id: null,
      goals: 0,
      assists: 0,
      rating: 6,
    }];
  }

  const scores = (ownScore != null && opponentScore != null)
    ? toFixtureScores(isHomeTeam, ownScore, opponentScore)
    : toFixtureScores(isHomeTeam, isHomeTeam ? homeScore : awayScore, isHomeTeam ? awayScore : homeScore);

  return {
    match_id: game.id,
    action: 'submit_result',
    is_home_team: isHomeTeam,
    home_score: scores.home_score,
    away_score: scores.away_score,
    own_score: scores.own_score,
    opponent_score: scores.opponent_score,
    player_stats: playerStats,
    goal_events: goalEvents.map((ev) => ({
      minute: Number(ev.minute) || null,
      scorer_player_id: ev.scorer_player_id || null,
      scorer_gamertag: ev.scorer_gamertag || null,
      assist_player_id: ev.assist_player_id || null,
      assist_gamertag: ev.assist_gamertag || null,
      is_penalty: !!ev.is_penalty,
    })),
    proof_url: proofUrl || null,
  };
}

export async function submitMatchResult(payload) {
  return stageClient.functions.invoke('matchKickoff', payload);
}

export async function afterMatchCompleted(match) {
  if (!match?.id) return;
  stageClient.functions.invoke('shirtSales', { action: 'generate_for_match', match_id: match.id }).catch(() => {});
  syncPlayerCareerStats(match.id).catch(() => {});
}

export async function reloadMatch(matchId) {
  const fresh = await stageClient.entities.Match.filter({ id: matchId }, null, 1).catch(() => []);
  return fresh?.[0] || null;
}

export function mapKickoffError(err, homeName, awayName) {
  const code = err?.data?.code || err?.code;
  if (code === 'DRESSING_ROOM_NOT_READY' || err?.status === 409) {
    return err?.message || `Both clubs need a seated player before kickoff (${homeName} / ${awayName}).`;
  }
  return err?.message || 'Kickoff failed';
}

export function mapResultError(err) {
  const code = err?.data?.code || err?.code;
  if (code === 'PROOF_REQUIRED' || err?.status === 400) {
    return 'Upload screenshot proof before submitting.';
  }
  if (code === 'AWAITING_HOME_SUBMISSION' || err?.status === 409) {
    return 'Home has not submitted yet. Wait for their result first.';
  }
  return err?.message || 'Could not submit result.';
}

export const MATCH_STATUS_LABEL = {
  scheduled: 'Scheduled',
  in_progress: 'Live',
  awaiting_confirmation: 'Pending',
  disputed: 'Disputed',
  completed: 'Full time',
  forfeit: 'Forfeit',
};
