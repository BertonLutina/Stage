function asObjectArray(value) {
  return Array.isArray(value) ? value.filter((row) => row && typeof row === 'object') : [];
}

export function outcomeOf(mine, theirs) {
  if (mine > theirs) return 'W';
  if (mine < theirs) return 'L';
  return 'D';
}

function playedAt(match) {
  const value = new Date(
    match.scheduled_date || match.match_date || match.created_date || match.updated_date || 0,
  ).getTime();
  return Number.isFinite(value) ? value : 0;
}

function toScore(value) {
  if (value == null || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

/**
 * The club's last completed results, newest first. Only matches that really have two scores
 * count; nothing is invented for the rest.
 * Row: { id, home, opponent, mine, theirs, outcome: 'W'|'D'|'L', competition }
 */
export function lastResults(matches, clubId, limit = 5) {
  if (!clubId) return [];
  const id = String(clubId);
  return asObjectArray(matches)
    .filter((match) => match.status === 'completed')
    .map((match) => {
      const home = String(match.home_club_id) === id;
      const away = String(match.away_club_id) === id;
      if (!home && !away) return null;
      const mine = toScore(home ? match.home_score : match.away_score);
      const theirs = toScore(home ? match.away_score : match.home_score);
      if (mine == null || theirs == null) return null;
      return {
        id: match.id,
        home,
        opponent: (home ? match.away_club_name : match.home_club_name) || null,
        mine,
        theirs,
        outcome: outcomeOf(mine, theirs),
        competition: match.competition_name || match.tournament_name || match.league_name || null,
        at: playedAt(match),
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.at - a.at)
    .slice(0, limit)
    .map(({ at, ...row }) => row);
}
