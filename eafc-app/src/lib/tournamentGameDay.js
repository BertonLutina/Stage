const CLOSED_STATUSES = new Set(['completed', 'forfeit', 'cancelled', 'canceled', 'deleted', 'voided', 'bye']);
const DRAW_ONLY_STATUSES = new Set(['unscheduled', 'awaiting_qualification']);

/** Cup fixtures finish on GameDay (`matchKickoff`), not a tournament-page score form. */
export function canOpenTournamentGameDay(match) {
  if (!match?.id) return false;
  const status = String(match.status || '').toLowerCase();
  if (CLOSED_STATUSES.has(status)) return false;
  if (DRAW_ONLY_STATUSES.has(status)) return false;
  return true;
}

export function tournamentGameDayPath(matchId) {
  return {
    pathname: '/(tabs)/matches/matchdetailscreen',
    params: { matchId: String(matchId) },
  };
}
