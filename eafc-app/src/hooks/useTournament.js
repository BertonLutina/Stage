import { useCallback } from 'react';
import { fetchTournamentMatches, fetchTournamentPublic } from '../api/tournamentActions';
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

export function buildTournamentView(tournament, rows) {
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

  const standings = String(tournament?.type || '').toLowerCase() === 'group_stage'
    ? groups.flatMap((group) => group.teams)
    : calculateLeagueStandings(matches, { participant_type: participantType });
  const completed = sortFixtures(matches.filter((match) =>
    TERMINAL_STATUSES.has(String(match?.status || '').toLowerCase())));
  const upcoming = sortFixtures(matches.filter((match) =>
    !TERMINAL_STATUSES.has(String(match?.status || '').toLowerCase())));
  const bracketMatches = matches.filter((match) => {
    const type = String(match?.type || '').toLowerCase();
    return !GROUP_TYPES.has(type) && !LEAGUE_TYPES.has(type);
  });

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
  const [tournament, matches] = await Promise.all([
    fetchTournamentPublic(tournamentId),
    fetchTournamentMatches(tournamentId),
  ]);
  return buildTournamentView(tournament, matches);
}

export default function useTournament(tournamentId) {
  const fetcher = useCallback(() => loadTournament(tournamentId), [tournamentId]);
  return useAsyncResource(fetcher, [tournamentId], { immediate: Boolean(tournamentId) });
}
