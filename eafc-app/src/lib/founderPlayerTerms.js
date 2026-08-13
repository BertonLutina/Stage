const TARGET_TYPES = new Set(['min', 'exact', 'range']);

export const FOUNDER_TARGET_STATS = [
  { value: 'matches_played', label: 'Matches Played' },
  { value: 'wins_count', label: 'Wins' },
  { value: 'goals', label: 'Goals' },
  { value: 'assists', label: 'Assists' },
  { value: 'man_of_the_match', label: 'MOTM Awards' },
  { value: 'avg_match_rating', label: 'Avg Match Rating' },
];

export function normalizePerformanceTargets(value) {
  if (Array.isArray(value)) return value.filter((row) => row && row.stat);
  if (value && Array.isArray(value.targets)) return value.targets.filter((row) => row && row.stat);
  return [];
}

export function normalizeFounderPlayerTerms(input = {}) {
  const weekly = Math.max(0, Number(input.weekly_salary_stc) || 0);
  const bonus = Math.max(0, Number(input.signing_bonus_stc) || 0);
  const targets = normalizePerformanceTargets(input.performance_targets).map((row) => ({
    stat: String(row.stat),
    type: TARGET_TYPES.has(row.type) ? row.type : 'min',
    value: Number(row.value) || 0,
    value_max: Number(row.value_max) || 0,
  }));
  return {
    weekly_salary_stc: weekly,
    signing_bonus_stc: bonus,
    performance_targets: targets,
  };
}
