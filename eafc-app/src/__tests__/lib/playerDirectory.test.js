import { filterPublicPlayerProfiles, isPublicPlayerProfile } from '../../lib/playerDirectory';

describe('player directory eligibility', () => {
  test('hides oauth stubs without a country', () => {
    expect(isPublicPlayerProfile({ id: 'p1' })).toBe(false);
    expect(isPublicPlayerProfile({ id: 'p2', country: 'France' })).toBe(true);
    expect(isPublicPlayerProfile({ id: 'p3', country_code: 'FR' })).toBe(true);
  });

  test('filters a mixed list', () => {
    expect(filterPublicPlayerProfiles([
      { id: 'stub' },
      { id: 'real', country_code: 'NL' },
      null,
    ])).toEqual([{ id: 'real', country_code: 'NL' }]);
  });
});
