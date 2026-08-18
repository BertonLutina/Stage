import { useCallback, useEffect, useMemo, useState } from 'react';
import { resolveMyPlayerAndClub, stageClient } from '../api/stageClient';
import { materializeConfirmedFixtures } from '../lib/gameDayIntegration';
import { isActiveGameDayMatch } from '../lib/gameDayPresentation';
import { isGameDayMatchSocketPayload, sameRecordId } from '../lib/gameDayRealtime';

function uniqById(rows = []) {
  const map = new Map();
  rows.forEach((row) => {
    if (row?.id) map.set(String(row.id), row);
  });
  return Array.from(map.values());
}

function deriveCompetition(match, tournament) {
  if (match?.competition_context) return match.competition_context;
  if (!match?.tournament_id || match.tournament_id === 'ranked') return 'Ranked Match';
  if (!tournament) return 'Tournament';
  const type = tournament.type || tournament.format;
  if (type === 'knockout' || type === 'single_elim') return `${tournament.name} · Knockout`;
  if (type === 'league' || type === 'classic_league') return `${tournament.name} · League`;
  if (type === 'group_stage' || type === 'group_knockout') return `${tournament.name} · Groups`;
  if (type === 'swiss' || type === 'swiss_ucl') return `${tournament.name} · Swiss`;
  return tournament.name || 'Tournament';
}

function getResult(match, club, player) {
  if (match.status !== 'completed' && match.status !== 'awaiting_confirmation') return null;
  const isSolo = match.mode === 'solo' || (!match.home_club_id && !match.away_club_id);
  const isHome = isSolo
    ? match.home_player_id === player?.id
    : club
      ? match.home_club_id === club.id
      : match.home_player_id === player?.id;
  const myScore = isHome ? Number(match.home_score ?? 0) : Number(match.away_score ?? 0);
  const theirScore = isHome ? Number(match.away_score ?? 0) : Number(match.home_score ?? 0);
  let outcome = 'D';
  if (myScore > theirScore) outcome = 'W';
  if (myScore < theirScore) outcome = 'L';
  return {
    outcome,
    myScore,
    theirScore,
    display: `${outcome} ${myScore}-${theirScore}`,
  };
}

function toEvent(match, { club, player, tournamentMap }) {
  const tournament = tournamentMap.get(match.tournament_id);
  const isSolo = match.mode === 'solo' || (!match.home_club_id && !match.away_club_id);
  const isHome = isSolo
    ? match.home_player_id === player?.id
    : club
      ? match.home_club_id === club.id
      : match.home_player_id === player?.id;

  const homeName = isSolo ? match.home_player_name : match.home_club_name || match.home_player_name;
  const awayName = isSolo ? match.away_player_name : match.away_club_name || match.away_player_name;
  const opposition = isHome ? awayName : homeName;

  return {
    id: match.id,
    type: 'match',
    date: match.scheduled_date || match.created_date,
    homeName: homeName || 'TBD',
    awayName: awayName || 'TBD',
    opposition: opposition || 'TBD',
    venue: isHome ? 'Home' : 'Away',
    venueKey: isHome ? 'home' : 'away',
    result: getResult(match, club, player),
    competition: deriveCompetition(match, tournament),
    status: match.status,
    matchData: match,
    isHome,
    isMyClub:
      Boolean(club) &&
      (match.home_club_id === club.id || match.away_club_id === club.id),
    hasStream: Boolean(match.home_stream_url || match.away_stream_url),
    videos: match.videos || [],
  };
}

function isActiveGameDay(match) {
  return isActiveGameDayMatch(match);
}

export default function useMatchesHub() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [events, setEvents] = useState([]);
  const [myClub, setMyClub] = useState(null);
  const [myPlayer, setMyPlayer] = useState(null);
  const [leagueFilter, setLeagueFilter] = useState('all');

  const load = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const { user, player, club } = await resolveMyPlayerAndClub();
      setMyClub(club || null);
      setMyPlayer(player || null);

      const clubId = club?.id || player?.club_id;
      const playerId = player?.id;

      const matchPromises = [];
      if (clubId) {
        matchPromises.push(
          stageClient.entities.Match.filter({ home_club_id: clubId }, '-scheduled_date', 50).catch(() => [])
        );
        matchPromises.push(
          stageClient.entities.Match.filter({ away_club_id: clubId }, '-scheduled_date', 50).catch(() => [])
        );
      }
      if (playerId) {
        matchPromises.push(
          stageClient.entities.Match.filter({ home_player_id: playerId }, '-scheduled_date', 40).catch(() => [])
        );
        matchPromises.push(
          stageClient.entities.Match.filter({ away_player_id: playerId }, '-scheduled_date', 40).catch(() => [])
        );
      }

      // Fallback browse list if user has no club/player yet
      if (!matchPromises.length) {
        matchPromises.push(stageClient.entities.Match.list('-scheduled_date', 40).catch(() => []));
      }

      const [tournaments, materialized, ...matchChunks] = await Promise.all([
        stageClient.entities.Tournament.list('-created_date', 100).catch(() => []),
        clubId ? materializeConfirmedFixtures(clubId).catch(() => []) : Promise.resolve([]),
        ...matchPromises,
      ]);

      const tournamentMap = new Map((tournaments || []).map((t) => [t.id, t]));
      const matches = uniqById([...(materialized || []), ...matchChunks.flat()]);
      const mapped = matches
        .map((m) => toEvent(m, { club, player, tournamentMap }))
        .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

      setEvents(mapped);
    } catch (err) {
      setEvents([]);
      setError(err?.message || 'Failed to load matches');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const unsub = stageClient.entities.Match.subscribe((event) => {
      if (event?.type === 'delete') {
        setEvents((prev) => prev.filter((row) => !sameRecordId(row.id, event.id)));
        return;
      }
      if (!isGameDayMatchSocketPayload(event?.data)) return;
      load({ silent: true });
    });
    return () => {
      if (typeof unsub === 'function') unsub();
    };
  }, [load]);

  const buckets = useMemo(() => {
    const live = events.filter((e) => e.status === 'in_progress' || e.status === 'awaiting_confirmation');
    const upcoming = events.filter((e) => e.status === 'scheduled' && isActiveGameDay(e.matchData));
    const results = events.filter((e) => e.status === 'completed' || e.status === 'forfeit');
    const gameDay = events.filter((e) => isActiveGameDay(e.matchData));

    const competitions = new Map();
    gameDay.forEach((e) => {
      const key = e.competition || 'Other';
      competitions.set(key, (competitions.get(key) || 0) + 1);
    });
    const leagueGroups = Array.from(competitions.entries())
      .map(([key, count]) => ({ key, count }))
      .sort((a, b) => b.count - a.count || a.key.localeCompare(b.key));

    return { live, upcoming, results, gameDay, leagueGroups };
  }, [events]);

  const filteredGameDay = useMemo(() => {
    if (leagueFilter === 'all') return buckets.gameDay;
    return buckets.gameDay.filter((e) => e.competition === leagueFilter);
  }, [buckets.gameDay, leagueFilter]);

  return {
    loading,
    error,
    reload: load,
    myClub,
    myPlayer,
    events,
    leagueFilter,
    setLeagueFilter,
    filteredGameDay,
    ...buckets,
  };
}
