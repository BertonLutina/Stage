const ROUND_LABELS = {
  1: 'Round 1',
  2: 'Round 2',
  3: 'Quarter-finals',
  4: 'Semi-finals',
  5: 'Final',
  round_of_64: 'Round of 64',
  round_of_32: 'Round of 32',
  round_of_16: 'Round of 16',
  quarter_final: 'Quarter-finals',
  semi_final: 'Semi-finals',
  final: 'Final',
  third_place: '3rd place',
  knockout: 'Knockout',
};

/** Normalize API rounds or a flat match list into [{ id, round_name, matches }]. */
export function normalizeBracketRounds(input) {
  const list = Array.isArray(input) ? input.filter(Boolean) : [];
  if (!list.length) return [];

  const looksLikeRounds = list.every(
    (row) => row && typeof row === 'object' && (Array.isArray(row.matches) || row.round_name || row.name),
  );
  if (looksLikeRounds && list.some((row) => Array.isArray(row.matches))) {
    return list.map((round, index) => ({
      id: String(round.id ?? round.round ?? round.type ?? `round-${index}`),
      round_name: String(round.round_name || round.name || ROUND_LABELS[round.type] || ROUND_LABELS[round.round] || `Round ${index + 1}`),
      matches: Array.isArray(round.matches) ? round.matches.filter(Boolean) : [],
    }));
  }

  const groups = new Map();
  for (const match of list) {
    if (!match || typeof match !== 'object') continue;
    const roundNum = Number(match.round);
    const key = match.type && ROUND_LABELS[match.type]
      ? String(match.type)
      : Number.isFinite(roundNum) && roundNum > 0
        ? `r-${roundNum}`
        : 'r-1';
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(match);
  }

  return [...groups.entries()]
    .sort((a, b) => {
      const ra = Number(a[1][0]?.round) || 0;
      const rb = Number(b[1][0]?.round) || 0;
      return ra - rb || String(a[0]).localeCompare(String(b[0]));
    })
    .map(([key, matches], index) => {
      const sample = matches[0] || {};
      const label = ROUND_LABELS[sample.type]
        || ROUND_LABELS[sample.round]
        || (Number(sample.round) ? `Round ${sample.round}` : `Round ${index + 1}`);
      return {
        id: key,
        round_name: label,
        matches,
      };
    });
}
