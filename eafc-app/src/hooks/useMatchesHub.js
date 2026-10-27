import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { resolveMyPlayerAndClub, stageClient } from '../api/stageClient';
import { materializeConfirmedFixtures } from '../lib/gameDayIntegration';
import { isActiveGameDayMatch } from '../lib/gameDayPresentation';
import { isGameDayMatchSocketPayload, sameRecordId } from '../lib/gameDayRealtime';
import {
  enrichGameDayMatches,
  filterGameDayMatches,
  isHubMatch,
  isOfficialGameDayResult,
} from '../lib/gameDayHub';
import { scheduleResult } from '../lib/scheduleResult';
import { matchBelongsToIdentity, pickMyClubForMatch, sameId, settleClubMatches, uniqueIdentityClubs } from '../lib/gameDayOps';

export const GAME_DAY_SCOPES = [
  { id: 'general', label: 'General' },
  { id: 'gost', label: 'GOST' },
  { id: 'regional', label: 'Regional' },
  { id: 'tournament', label: 'Tournament' },
  { id: 'friendly', label: 'Friendly' },
];

export const GAME_DAY_STATUSES = [
  { id: 'all', label: 'All' },
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'live', label: 'Live' },
  { id: 'completed', label: 'Completed' },
];

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

function matchIsHome(match, club, player) {
  const isSolo = match.mode === 'solo' || (!match.home_club_id && !match.away_club_id);
  if (isSolo) return sameId(match.home_player_id, player?.id);
  if (club) return sameId(match.home_club_id, club.id);
  return sameId(match.home_player_id, player?.id);
}

function toEvent(match, { clubs, player, tournamentMap }) {
  const tournament = tournamentMap.get(match.tournament_id);
  const club = pickMyClubForMatch(match, clubs);
  const isSolo = match.mode === 'solo' || (!match.home_club_id && !match.away_club_id);
  const isHome = matchIsHome(match, club, player);

  const homeName = isSolo ? match.home_player_name : match.home_club_name || match.home_player_name;
  const awayName = isSolo ? match.away_player_name : match.away_club_name || match.away_player_name;
  const opposition = isHome ? awayName : homeName;
  const result = scheduleResult(match, club, player);

  return {
    id: match.id,
    type: 'match',
    date: match.scheduled_date || match.created_date,
    homeName: homeName || 'TBD',
    awayName: awayName || 'TBD',
    opposition: opposition || 'TBD',
    venue: isHome ? 'Home' : 'Away',
    venueKey: isHome ? 'home' : 'away',
    result: result
      ? { ...result, display: `${result.outcome} ${result.display}` }
      : null,
    competition: deriveCompetition(match, tournament),
    status: match.status,
    matchData: match,
    isHome,
    isMyClub: Boolean(club) && (
      sameId(match.home_club_id, club.id) || sameId(match.away_club_id, club.id)
    ),
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
  const [backendNotice, setBackendNotice] = useState('');
  const [events, setEvents] = useState([]);
  const [myClub, setMyClub] = useState(null);
  const [presidentClub, setPresidentClub] = useState(null);
  const [myPlayer, setMyPlayer] = useState(null);
  const [leagueFilter, setLeagueFilter] = useState('all');
  const [scopeFilter, setScopeFilter] = useState('general');
  const [statusFilter, setStatusFilter] = useState('all');
  const identityRef = useRef({ clubs: [], playerId: null });
  const eventsRef = useRef([]);
  const loadGeneration = useRef(0);

  const load = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    setError(null);
    const generation = ++loadGeneration.current;
    const isCurrent = () => generation === loadGeneration.current;
    try {
      const { player, club, presidentClub: ownedClub } = await resolveMyPlayerAndClub();
      if (!isCurrent()) return;
      const clubs = uniqueIdentityClubs(
        player?.club_id ? { id: player.club_id } : null,
        club,
        ownedClub,
      );
      identityRef.current = { clubs, playerId: player?.id || null };
      setMyClub(club || ownedClub || null);
      setPresidentClub(ownedClub || null);
      setMyPlayer(player || null);

      const clubIds = clubs.map((row) => row.id);
      const playerId = player?.id;
      await Promise.all(clubIds.map((id) => settleClubMatches(id).catch(() => null)));
      if (!isCurrent()) return;

      const matchPromises = [];
      clubIds.forEach((clubId) => {
        matchPromises.push(
          stageClient.entities.Match.filter({ home_club_id: clubId }, '-scheduled_date', 50).catch(() => [])
        );
        matchPromises.push(
          stageClient.entities.Match.filter({ away_club_id: clubId }, '-scheduled_date', 50).catch(() => [])
        );
      });
      if (playerId) {
        matchPromises.push(
          stageClient.entities.Match.filter({ home_player_id: playerId }, '-scheduled_date', 40).catch(() => [])
        );
        matchPromises.push(
          stageClient.entities.Match.filter({ away_player_id: playerId }, '-scheduled_date', 40).catch(() => [])
        );
      }

      if (!matchPromises.length) {
        matchPromises.push(stageClient.entities.Match.list('-scheduled_date', 40).catch(() => []));
      }

      const [tournaments, ...rest] = await Promise.all([
        stageClient.entities.Tournament.list('-created_date', 100).catch(() => []),
        ...clubIds.map((clubId) => materializeConfirmedFixtures(clubId).catch(() => [])),
        ...matchPromises,
      ]);
      if (!isCurrent()) return;

      const materialized = rest.slice(0, clubIds.length).flat();
      const matchChunks = rest.slice(clubIds.length);
      const tournamentMap = new Map((tournaments || []).map((t) => [t.id, t]));
      const matchMap = new Map();
      uniqById([...(materialized || []), ...matchChunks.flat()]).forEach((match) => {
        matchMap.set(match.id, match);
      });

      const notice = await enrichGameDayMatches(
        matchMap,
        (query) => stageClient.http.get('/game-day/matches', query),
        isCurrent,
      ).catch((err) => (err?.status === 404 ? err.message : ''));
      if (!isCurrent()) return;
      setBackendNotice(typeof notice === 'string' ? notice : '');

      const matches = Array.from(matchMap.values()).filter(isHubMatch);
      const mapped = matches
        .map((m) => toEvent(m, { clubs, player, tournamentMap }))
        .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

      eventsRef.current = mapped;
      setEvents(mapped);
    } catch (err) {
      if (!isCurrent()) return;
      setEvents([]);
      setError(err?.message || 'Failed to load matches');
    } finally {
      if (isCurrent()) setLoading(false);
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
      const data = event?.data;
      if (!isGameDayMatchSocketPayload(data)) return;
      const known = eventsRef.current.some((row) => sameRecordId(row.id, data.id));
      if (!known && !matchBelongsToIdentity(data, identityRef.current)) return;
      load({ silent: true });
    });
    return () => {
      if (typeof unsub === 'function') unsub();
    };
  }, [load]);

  const scopedEvents = useMemo(() => {
    const matches = events.map((e) => e.matchData).filter(Boolean);
    const allowed = new Set(
      filterGameDayMatches(matches, { scope: scopeFilter, status: statusFilter })
        .map((m) => String(m.id)),
    );
    return events.filter((e) => allowed.has(String(e.id)));
  }, [events, scopeFilter, statusFilter]);

  const buckets = useMemo(() => {
    const live = scopedEvents.filter((e) => e.status === 'in_progress' || e.status === 'awaiting_confirmation');
    const upcoming = scopedEvents.filter((e) => e.status === 'scheduled' && isActiveGameDay(e.matchData));
    const results = scopedEvents.filter((e) => isOfficialGameDayResult(e.matchData));
    const gameDay = statusFilter === 'completed'
      ? results
      : statusFilter === 'live'
        ? live
        : statusFilter === 'upcoming'
          ? upcoming
          : scopedEvents.filter((e) => isActiveGameDay(e.matchData) || isOfficialGameDayResult(e.matchData));

    const competitions = new Map();
    gameDay.forEach((e) => {
      const key = e.competition || 'Other';
      competitions.set(key, (competitions.get(key) || 0) + 1);
    });
    const leagueGroups = Array.from(competitions.entries())
      .map(([key, count]) => ({ key, count }))
      .sort((a, b) => b.count - a.count || a.key.localeCompare(b.key));

    return { live, upcoming, results, gameDay, leagueGroups };
  }, [scopedEvents, statusFilter]);

  const filteredGameDay = useMemo(() => {
    if (leagueFilter === 'all') return buckets.gameDay;
    return buckets.gameDay.filter((e) => e.competition === leagueFilter);
  }, [buckets.gameDay, leagueFilter]);

  return {
    loading,
    error,
    backendNotice,
    reload: load,
    myClub,
    presidentClub,
    myPlayer,
    setMyPlayer,
    events,
    scopedEvents,
    leagueFilter,
    setLeagueFilter,
    scopeFilter,
    setScopeFilter,
    statusFilter,
    setStatusFilter,
    filteredGameDay,
    ...buckets,
  };
}
