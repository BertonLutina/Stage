/** Normalize standings rows from tournament engine, API, or competition seasons. */
export function normalizeStandingRow(row = {}, index = 0) {
  const played = Number(row.P ?? row.played ?? row.matches_played ?? 0) || 0;
  const wins = Number(row.W ?? row.wins ?? 0) || 0;
  const draws = Number(row.D ?? row.draws ?? 0) || 0;
  const losses = Number(row.L ?? row.losses ?? 0) || 0;
  const goalsFor = Number(row.GF ?? row.goals_for ?? row.gf ?? 0) || 0;
  const goalsAgainst = Number(row.GA ?? row.goals_against ?? row.ga ?? 0) || 0;
  const goalDiff = Number(
    row.GD ?? row.goal_difference ?? row.gd ?? (goalsFor - goalsAgainst),
  ) || 0;
  const points = Number(row.Pts ?? row.points ?? row.pts ?? 0) || 0;
  const name = String(
    row.name
      || row.club_name
      || row.player_name
      || row.club_tag
      || row.gamertag
      || row.label
      || '—',
  );
  const id = String(row.id || row.team_id || row.club_id || row.player_id || `${name}-${index}`);

  return {
    id,
    name,
    played,
    wins,
    draws,
    losses,
    goalsFor,
    goalsAgainst,
    goalDiff,
    points,
    form: row.form || null,
    raw: row,
  };
}

export function normalizeStandings(rows = []) {
  if (!Array.isArray(rows)) return [];
  return rows.filter(Boolean).map((row, index) => normalizeStandingRow(row, index));
}
