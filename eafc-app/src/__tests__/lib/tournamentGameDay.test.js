const {
  canOpenTournamentGameDay,
  tournamentGameDayMobileRoute,
  tournamentGameDayWebPath,
} = require('../../lib/tournamentGameDay');

describe('tournament Game Day routing', () => {
  test('opens Game Day after the fixture is scheduled, live, or in result negotiation', () => {
    expect(canOpenTournamentGameDay({ id: 'm1', status: 'scheduled' })).toBe(true);
    expect(canOpenTournamentGameDay({ id: 'm1', status: 'in_progress' })).toBe(true);
    expect(canOpenTournamentGameDay({ id: 'm1', status: 'awaiting_confirmation' })).toBe(true);
    expect(canOpenTournamentGameDay({ id: 'm1', status: 'disputed' })).toBe(true);
  });

  test('keeps unscheduled draw rows and finished matches off the Game Day CTA', () => {
    expect(canOpenTournamentGameDay({ id: 'm1', status: 'unscheduled' })).toBe(false);
    expect(canOpenTournamentGameDay({ id: 'm1', status: 'completed' })).toBe(false);
    expect(canOpenTournamentGameDay({ id: 'm1', status: 'forfeit' })).toBe(false);
    expect(canOpenTournamentGameDay({ status: 'scheduled' })).toBe(false);
  });

  test('points both clients at the one Game Day match', () => {
    expect(tournamentGameDayWebPath('cup-9')).toBe('/game-day?match=cup-9');
    expect(tournamentGameDayMobileRoute('cup-9')).toEqual({
      pathname: '/(tabs)/matches/matchdetailscreen',
      params: { matchId: 'cup-9' },
    });
  });
});
