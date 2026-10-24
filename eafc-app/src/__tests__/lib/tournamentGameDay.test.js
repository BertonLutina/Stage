import { canOpenTournamentGameDay, tournamentGameDayPath } from '../../lib/tournamentGameDay';

describe('tournamentGameDay', () => {
  test('opens open fixtures and blocks closed ones', () => {
    expect(canOpenTournamentGameDay({ id: 'm1', status: 'scheduled' })).toBe(true);
    expect(canOpenTournamentGameDay({ id: 'm1', status: 'in_progress' })).toBe(true);
    expect(canOpenTournamentGameDay({ id: 'm1', status: 'completed' })).toBe(false);
    expect(canOpenTournamentGameDay({ id: 'm1', status: 'bye' })).toBe(false);
    expect(canOpenTournamentGameDay({ id: 'm1', status: 'unscheduled' })).toBe(false);
    expect(canOpenTournamentGameDay({ status: 'scheduled' })).toBe(false);
  });

  test('builds match detail path for game day', () => {
    expect(tournamentGameDayPath('abc')).toEqual({
      pathname: '/(tabs)/matches/matchdetailscreen',
      params: { matchId: 'abc' },
    });
  });
});
