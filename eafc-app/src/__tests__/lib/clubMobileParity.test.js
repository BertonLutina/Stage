import {
  buildClubTabGroups,
  clubTabLabels,
  CLUB_OFFICE_SECTIONS,
} from '../../lib/clubOfficeTabs';
import { getCountryDisplayName, getPlayerNationality } from '../../lib/countryDisplay';
import { groupClubFixtures, fixtureCanSetAvailability } from '../../lib/clubFixtures';
import { buildClubLeaderboard, buildClubPlayerStatMap } from '../../lib/clubPlayerStats';

describe('clubOfficeTabs', () => {
  test('builds public tabs and optional chat/office', () => {
    const publicTabs = buildClubTabGroups();
    expect(publicTabs.map((group) => group.tabs[0])).toEqual(['posts', 'squad', 'stats', 'fixtures', 'trophies']);

    const staffTabs = buildClubTabGroups({ canOpenClubOffice: true, showChat: true });
    expect(staffTabs.map((group) => group.tabs[0])).toContain('chat');
    expect(staffTabs.map((group) => group.tabs[0])).toContain('club-office');
    expect(clubTabLabels().fixtures).toBe('Fixtures');
    expect(CLUB_OFFICE_SECTIONS.map((row) => row.id)).toEqual(['contracts', 'finance', 'stadium', 'shirts', 'audit']);
  });
});

describe('countryDisplay', () => {
  test('maps short codes to readable football names', () => {
    expect(getCountryDisplayName('CD')).toBe('DR Congo');
    expect(getCountryDisplayName('NL')).toBe('Netherlands');
    expect(getCountryDisplayName('CA')).toBe('Canada');
    expect(getPlayerNationality({ country_code: 'CD' }).label).toBe('DR Congo');
  });
});

describe('clubFixtures', () => {
  test('groups fixtures and blocks availability on terminal fixtures', () => {
    const grouped = groupClubFixtures([
      { id: '1', home_club_id: 'c1', competition_name: 'Supreme League fixture', status: 'scheduled' },
      { id: '2', home_club_id: 'c1', tournament_name: 'Cup', status: 'completed', home_score: 2, away_score: 1 },
    ]);
    expect(grouped.some((group) => group.key === 'supreme')).toBe(true);
    expect(fixtureCanSetAvailability({ id: 'x', status: 'scheduled' })).toBe(true);
    expect(fixtureCanSetAvailability({ id: 'x', status: 'completed', home_score: 1, away_score: 0 })).toBe(false);
  });
});

describe('clubPlayerStats', () => {
  test('builds leaderboard rows from club stat rows', () => {
    const players = [{ id: 'p1', gamertag: 'Alpha' }, { id: 'p2', gamertag: 'Beta' }];
    const map = buildClubPlayerStatMap(players, [
      { player_id: 'p1', club_id: 'c1', goals: 3, assists: 1, rating: 8, match_id: 'm1' },
      { player_id: 'p2', club_id: 'c1', goals: 5, assists: 0, rating: 7.5, match_id: 'm2' },
    ], 'c1');
    const scorers = buildClubLeaderboard(players, 'goals', map);
    expect(scorers[0].player.id).toBe('p2');
    expect(scorers[0].value).toBe(5);
  });
});
