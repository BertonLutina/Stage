import { useCallback } from 'react';
import {
  fetchTournamentMatches,
  fetchTournamentPublic,
  fetchTournamentStandings,
  fetchTournamentBrackets,
} from '../api/tournamentActions';
import { calculateGroupStandings, calculateLeagueStandings } from '../lib/tournamentEngine';
import useAsyncResource from './useAsyncResource';

const TERMINAL_STATUSES = new Set(['completed', 'forfeit', 'cancelled']);
const LEAGUE_TYPES = new Set(['league', 'ucl_league', 'swiss', 'swiss_ucl']);
const GROUP_TYPES = new Set(['group', 'group_stage']);

function matchDate(match) {
  const value = match?.scheduled_at || match?.scheduled_date || match?.match_date || match?.date;
  const time = value ? new Date(value).getTime() : Number.NaN;
  return Number.isFinite(time) ? time : Number.MAX_SAFE_INTEGER;
}

function sortFixtures(rows) {
  return [...rows].sort((left, right) => matchDate(left) - matchDate(right));
}

/**
 * Map server standings rows (/tournaments/:id/standings) to the derived table
 * shape. Returns null unless every row is well-formed (has a name), so a partial
 * or empty server response falls back to the client derivation.
 */
function mapServerStandings(rows) {
  if (!Array.isArray(rows) || rows.length === 0) return null;
  const mapped = rows.map((s, i) => {
    const name = s.club_name || s.team_name || s.name || s.gamertag;
    if (!name) return null;
    const gf = Number(s.gf ?? s.goals_for ?? 0);
    const ga = Number(s.ga ?? s.goals_against ?? 0);
    return {
      id: s.team_id || s.club_id || s.id,
      name,
      avatar_url: s.logo_url || s.avatar_url || null,
      P: Number(s.played ?? s.matches_played ?? 0),
      W: Number(s.won ?? s.wins ?? 0),
      D: Number(s.drawn ?? s.draws ?? 0),
      L: Number(s.lost ?? s.losses ?? 0),
      GF: gf,
      GA: ga,
      GD: Number(s.gd ?? s.goal_difference ?? gf - ga),
      Pts: Number(s.pts ?? s.points ?? 0),
      rank: Number(s.rank ?? i + 1),
    };
  });
  return mapped.every(Boolean) ? mapped : null;
}

/** Flatten server bracket rounds ([{name, matches}]) to the flat match list. */
function flattenServerBrackets(rounds) {
  if (!Array.isArray(rounds) || rounds.length === 0) return null;
  const flat = rounds.flatMap((round) => (Array.isArray(round?.matches) ? round.matches : []));
  return flat.length ? flat : null;
}

export function buildTournamentView(tournament, rows, server = {}) {
  const matches = Array.isArray(rows) ? rows.filter(Boolean) : [];
  const participantType = tournament?.participant_type === 'player' ? 'player' : 'club';
  const numGroups = Math.max(1, Number(tournament?.num_groups) || 1);
  const groupRows = calculateGroupStandings(matches, numGroups, participantType);
  const groups = groupRows
    .map((teams, index) => ({
      id: String(index),
      name: `Group ${String.fromCharCode(65 + index)}`,
      teams,
      matches: matches.filter(
        (match) => GROUP_TYPES.has(String(match?.type || '').toLowerCase())
          && Number(match.group_number ?? match.group ?? -1) === index,
      ).sort((left, right) => {
        const leftDone = TERMINAL_STATUSES.has(String(left?.status || '').toLowerCase());
        const rightDone = TERMINAL_STATUSES.has(String(right?.status || '').toLowerCase());
        return Number(rightDone) - Number(leftDone) || matchDate(left) - matchDate(right);
      }),
    }))
    .filter((group) => group.teams.length > 0 || group.matches.length > 0);

  const derivedStandings = String(tournament?.type || '').toLowerCase() === 'group_stage'
    ? groups.flatMap((group) => group.teams)
    : calculateLeagueStandings(matches, { participant_type: participantType });
  // Prefer the server-computed standings (official competitions); fall back to
  // the client derivation (community tournaments return []).
  const standings = mapServerStandings(server.standings) || derivedStandings;
  const completed = sortFixtures(matches.filter((match) =>
    TERMINAL_STATUSES.has(String(match?.status || '').toLowerCase())));
  const upcoming = sortFixtures(matches.filter((match) =>
    !TERMINAL_STATUSES.has(String(match?.status || '').toLowerCase())));
  const derivedBracketMatches = matches.filter((match) => {
    const type = String(match?.type || '').toLowerCase();
    return !GROUP_TYPES.has(type) && !LEAGUE_TYPES.has(type);
  });
  const bracketMatches = flattenServerBrackets(server.brackets) || derivedBracketMatches;

  return {
    tournament: tournament || null,
    matches,
    groups,
    standings,
    fixtures: sortFixtures(matches),
    upcoming,
    completed,
    bracketMatches,
    nextMatch: upcoming[0] || null,
  };
}

export async function loadTournament(tournamentId) {
  const [tournament, matches, standings, brackets] = await Promise.all([
    fetchTournamentPublic(tournamentId),
    fetchTournamentMatches(tournamentId),
    fetchTournamentStandings(tournamentId),
    fetchTournamentBrackets(tournamentId),
  ]);
  return buildTournamentView(tournament, matches, { standings, brackets });
}

export default function useTournament(tournamentId) {
  const fetcher = useCallback(() => loadTournament(tournamentId), [tournamentId]);
  return useAsyncResource(fetcher, [tournamentId], { immediate: Boolean(tournamentId) });
}
