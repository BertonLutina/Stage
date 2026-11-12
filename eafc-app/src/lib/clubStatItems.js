/**
 * Stat cells for a club profile bundle. loadClubProfile zero-fills `record` and
 * turns failed sub-fetches into [], so a zero means "unknown" and is hidden rather
 * than shown as a real number. `record.wins` only covers the most recent completed
 * matches, hence "Recent wins".
 */
export function clubStatItems(bundle) {
  const record = bundle?.record;
  const players = Array.isArray(bundle?.players) ? bundle.players : [];
  const trophies = Array.isArray(bundle?.trophies) ? bundle.trophies : [];
  const wins = Number(record?.wins);
  const draws = Number(record?.draws);
  const losses = Number(record?.losses);
  const hasRecord = record && Number(record.totalGames) > 0
    && [wins, draws, losses].every((n) => Number.isFinite(n));
  return [
    hasRecord
      ? { label: 'Record', value: `${wins}-${draws}-${losses}` }
      : null,
    players.length > 0 ? { label: 'Squad', value: String(players.length) } : null,
    trophies.length > 0 ? { label: 'Trophies', value: String(trophies.length) } : null,
  ].filter(Boolean);
}
