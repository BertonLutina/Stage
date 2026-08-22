import {
  filterClubDirectory,
  filterNewsItems,
  filterPlayerDirectory,
  filterRankings,
  filterTransferEntries,
  formatSTC,
  isNewsVisible,
  mergeNewsAndPress,
  normalizeFollowRows,
  resolveLifestyleCategory,
  transferBadgeLabel,
} from '../../lib/stageDirectories';

describe('stage directory helpers', () => {
  test('filters public players by gamertag, platform and position', () => {
    const players = [
      { id: '1', gamertag: 'Neo', platform: 'PC', position: 'ST' },
      { id: '2', gamertag: 'Trinity', platform: 'PlayStation', position: 'CAM' },
    ];
    expect(filterPlayerDirectory(players, { query: 'tri' }).map((p) => p.id)).toEqual(['2']);
    expect(filterPlayerDirectory(players, { platform: 'PC' }).map((p) => p.id)).toEqual(['1']);
    expect(filterPlayerDirectory(
      [...players, { id: '3', gamertag: 'Morpheus', platform: 'PS5', position: 'CB' }],
      { platform: 'PlayStation' },
    ).map((p) => p.id)).toEqual(['3', '2']);
    expect(filterPlayerDirectory(players, { position: 'CAM' }).map((p) => p.id)).toEqual(['2']);
  });

  test('filters clubs by name, tag and region', () => {
    const clubs = [
      { id: 'c1', name: 'Ajax', tag: 'AFC', region: 'Europe', platform: 'PlayStation' },
      { id: 'c2', name: 'Galaxy', tag: 'LAG', region: 'North America', platform: 'Xbox' },
    ];
    expect(filterClubDirectory(clubs, { query: 'afc' }).map((c) => c.id)).toEqual(['c1']);
    expect(filterClubDirectory(clubs, { region: 'North America' }).map((c) => c.id)).toEqual(['c2']);
  });

  test('filters transfer entries including expiring_soon under expiring', () => {
    const entries = [
      { player: { id: 'p1', gamertag: 'Free', position: 'ST', platform: 'PC' }, badgeType: 'free_agent' },
      { player: { id: 'p2', gamertag: 'Soon', position: 'CM', platform: 'PC' }, badgeType: 'expiring_soon' },
    ];
    expect(filterTransferEntries(entries, { status: 'expiring' }).map((e) => e.player.id)).toEqual(['p2']);
    expect(filterTransferEntries(entries, { query: 'free' }).map((e) => e.player.id)).toEqual(['p1']);
  });

  test('merges news and press, then applies visibility', () => {
    const today = new Date().toISOString();
    const items = mergeNewsAndPress(
      [{ id: 'n1', title: 'Deal', category: 'transfers', published_at: '2026-08-02' }],
      [{ id: 'pr1', title: 'Press', published_at: today }],
    );
    expect(items[0]._category).toBe('press_conference');
    expect(filterNewsItems(items, 'mercato')).toHaveLength(1);
    expect(filterNewsItems(items, 'club_news')).toHaveLength(0);
    expect(filterNewsItems(items, 'player_news')).toHaveLength(0);
    expect(filterNewsItems(items, 'daily_news')).toHaveLength(1);
    expect(filterNewsItems(items, 'tournament')).toHaveLength(0);
    expect(filterNewsItems(items, 'competitions')).toHaveLength(0);
    expect(filterNewsItems(items, 'all')).toHaveLength(2);
    expect(isNewsVisible({ is_global: true }, null, null)).toBe(true);
    expect(isNewsVisible({
      visible_to_club_ids: ['c1'],
      visible_to_player_ids: [],
    }, null, { id: 'c2' })).toBe(false);
  });

  test('normalizes follow rows and ranking scopes', () => {
    expect(normalizeFollowRows([
      { id: 'f1', target_type: 'club', target_id: 'c1', club_name: 'Ajax' },
      { player_id: 'p1', gamertag: 'Neo' },
    ])).toEqual([
      { id: 'f1', type: 'club', targetId: 'c1', name: 'Ajax', avatar: '' },
      { id: 'player-p1', type: 'player', targetId: 'p1', name: 'Neo', avatar: '' },
    ]);
    expect(filterRankings(
      [{ id: '1', region: 'Europe', country_code: 'FR' }, { id: '2', region: 'Asia', country_code: 'JP' }],
      { scope: 'country', country: 'FR' },
    ).map((r) => r.id)).toEqual(['1']);
  });

  test('formats STC and lifestyle categories', () => {
    expect(formatSTC(1500)).toBe('1.5K');
    expect(formatSTC(2_000_000)).toBe('2M');
    expect(resolveLifestyleCategory('vehicle')).toBe('cars');
    expect(transferBadgeLabel('expiring_soon', 2)).toBe('2d left');
  });
});
