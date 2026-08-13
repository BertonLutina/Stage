import {
  buildPlayerPresidentDirectoryRows,
  matchesPlayerPresidentQuery,
} from '../../lib/presidentDirectory';

describe('president directory', () => {
  test('builds rows from club.president_player_id', () => {
    const rows = buildPlayerPresidentDirectoryRows(
      [{ id: 'c1', name: 'Ajax', tag: 'AFC', president_player_id: 'p1', logo_url: 'logo.png' }],
      [{ id: 'p1', gamertag: 'Prez', avatar_url: 'a.png', country_code: 'NL', platform: 'PlayStation' }],
    );
    expect(rows).toEqual([expect.objectContaining({
      id: 'p1',
      player_id: 'p1',
      club_id: 'c1',
      club_name: 'Ajax',
      display_name: 'Prez',
      role_title: 'President',
    })]);
  });

  test('skips clubs without a linked player', () => {
    expect(buildPlayerPresidentDirectoryRows(
      [{ id: 'c1', president_player_id: 'missing' }],
      [{ id: 'p2' }],
    )).toEqual([]);
  });

  test('matches search across name and club', () => {
    const row = { display_name: 'Neo', club_name: 'Matrix', club_tag: 'MX', country_code: 'FR', platform: 'PC' };
    expect(matchesPlayerPresidentQuery(row, 'mat')).toBe(true);
    expect(matchesPlayerPresidentQuery(row, 'xbox')).toBe(false);
  });
});
