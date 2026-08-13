/** Minimal contract type meta for dashboard tenure/progress. */

export const CONTRACT_TYPES = {
  trial: { label: 'Trial', max_games: 5, max_days: 14 },
  academy: { label: 'Academy', max_games: 20, max_days: 30 },
  squad: { label: 'Squad Player', max_games: 100, max_days: 90 },
  important: { label: 'Important Player', max_games: 250, max_days: 120 },
  star: { label: 'Star Player', max_games: 400, max_days: 180 },
  founder_player: { label: 'Founder Player', max_games: 999, max_days: 3650 },
  founder: { label: 'Founder', max_games: 999, max_days: 3650 },
  ownership: { label: 'Club President', max_games: 999, max_days: 3650 },
};

export function getContractProgress(contract) {
  if (!contract?.start_date) return null;
  const meta = CONTRACT_TYPES[contract?.contract_type] || CONTRACT_TYPES.squad;
  const daysSinceStart = Math.floor(
    (Date.now() - new Date(contract.start_date).getTime()) / (1000 * 60 * 60 * 24),
  );
  const gamesPlayed = contract.games_played || 0;
  const daysLeft = Math.max(0, meta.max_days - daysSinceStart);
  const gamesLeft = Math.max(0, meta.max_games - gamesPlayed);
  const gamesPercent = Math.min(100, Math.round((gamesPlayed / meta.max_games) * 100));
  const daysPercent = Math.min(100, Math.round((daysSinceStart / meta.max_days) * 100));
  return {
    gamesPlayed,
    gamesLeft,
    gamesPercent,
    daysSinceStart,
    daysLeft,
    daysPercent,
    maxGames: meta.max_games,
    maxDays: meta.max_days,
  };
}
