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
  return [
    record && Number(record.totalGames) > 0 && Number.isFinite(Number(record.wins))
      ? { label: 'Recent wins', value: String(record.wins) }
      : null,
    players.length > 0 ? { label: 'Players', value: String(players.length) } : null,
    trophies.length > 0 ? { label: 'Trophies', value: String(trophies.length) } : null,
  ].filter(Boolean);
}
