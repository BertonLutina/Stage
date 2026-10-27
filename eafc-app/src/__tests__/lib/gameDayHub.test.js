import {
  filterGameDayMatches,
  gameCategory,
  isHubMatch,
  isOfficialGameDayResult,
} from '../../lib/gameDayHub';

describe('gameDayHub', () => {
  test('classifies regional and tournament categories', () => {
    expect(gameCategory({ source_fixture_type: 'regional_league' })).toBe('regional');
    expect(gameCategory({ tournament_id: 't1', type: 'knockout' })).toBe('tournament');
    expect(gameCategory({ type: 'friendly' })).toBe('friendly');
  });

  test('filters by scope and search', () => {
    const games = [
      { id: '1', status: 'scheduled', category: 'gost', home_club_name: 'Alpha' },
      { id: '2', status: 'scheduled', category: 'regional', home_club_name: 'Beta' },
      { id: '3', status: 'completed', result_state: 'confirmed', category: 'gost', home_club_name: 'Alpha United' },
    ];
    expect(filterGameDayMatches(games, { scope: 'gost' }).map((g) => g.id)).toEqual(['1', '3']);
    expect(filterGameDayMatches(games, { search: 'united' }).map((g) => g.id)).toEqual(['3']);
  });

  test('hub match excludes voided rows', () => {
    expect(isHubMatch({ status: 'voided' })).toBe(false);
    expect(isOfficialGameDayResult({
      status: 'completed',
      result_state: 'confirmed',
    })).toBe(true);
  });
});
