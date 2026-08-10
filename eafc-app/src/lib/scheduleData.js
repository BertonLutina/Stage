import { resolveMyPlayerAndClub, stageClient } from '@/api/stageClient';
import { buildScheduleEvents, uniqById } from '@/lib/scheduleEvents';

/**
 * Load Schedule Events for the signed-in identity (web /schedule parity).
 */
export async function loadScheduleData({ scopedTournamentId = null } = {}) {
  const { user, player, club } = await resolveMyPlayerAndClub();
  if (!user) {
    return {
      user: null,
      player: null,
      club: null,
      events: [],
      players: [],
    };
  }

  const [tournaments, contracts] = await Promise.all([
    stageClient.entities.Tournament.list('-created_date', 100).catch(() => []),
    stageClient.entities.PlayerContract.list('-created_date', 50).catch(() => []),
  ]);

  let clubPlayers = [];
  if (club?.id) {
    clubPlayers = await stageClient.entities.Player.filter({ club_id: club.id }).catch(() => []);
  }

  const matchFilters = [];
  if (club?.id) {
    matchFilters.push(
      stageClient.entities.Match.filter({ home_club_id: club.id }, '-scheduled_date', 50).catch(() => []),
      stageClient.entities.Match.filter({ away_club_id: club.id }, '-scheduled_date', 50).catch(() => []),
    );
  }
  if (player?.id) {
    matchFilters.push(
      stageClient.entities.Match.filter({ home_player_id: player.id }, '-scheduled_date', 30).catch(() => []),
      stageClient.entities.Match.filter({ away_player_id: player.id }, '-scheduled_date', 30).catch(() => []),
    );
  }

  const matchChunks = matchFilters.length
    ? await Promise.all(matchFilters)
    : [await stageClient.entities.Match.list('-scheduled_date', 40).catch(() => [])];

  const matches = uniqById(matchChunks.flat());
  const events = buildScheduleEvents({
    matches,
    tournaments: tournaments || [],
    contracts: contracts || [],
    player,
    club,
    now: new Date(),
    scopedTournamentId,
  });

  return {
    user,
    player,
    club,
    events,
    players: clubPlayers || [],
  };
}
