import { getMiniAppGroups } from '../../lib/miniApps';

describe('mini apps catalog', () => {
  test('does not duplicate native tab destinations without a squad deep link', () => {
    for (const mode of ['player', 'club']) {
      const items = getMiniAppGroups(mode).flatMap((group) => group.items);
      const bareNative = items.filter((item) => (
        ['/(tabs)/dashboard', '/(tabs)/matches', '/(tabs)/tournaments'].includes(item.href)
      ));
      expect(bareNative).toEqual([]);
    }
  });

  test('puts market discovery apps in Market, not Account', () => {
    const groups = getMiniAppGroups('player');
    const marketIds = groups.find((g) => g.id === 'market').items.map((item) => item.id);
    const accountIds = groups.find((g) => g.id === 'account').items.map((item) => item.id);
    const clubIds = groups.find((g) => g.id === 'club').items.map((item) => item.id);

    expect(marketIds).toEqual([
      'find-clubs',
      'find-players',
      'find-presidents',
      'scouting',
      'transfers',
      'lifestyle',
      'wallet',
    ]);
    expect(accountIds).not.toEqual(expect.arrayContaining([
      'find-clubs',
      'find-players',
      'lifestyle',
      'wallet',
    ]));
    expect(clubIds).toEqual(expect.arrayContaining(['club-players']));
    expect(clubIds).not.toEqual(expect.arrayContaining(['find-players']));
  });

  test('market and leftover apps are wired to Stage screens', () => {
    const items = getMiniAppGroups('player').flatMap((group) => group.items);
    const byId = Object.fromEntries(items.map((item) => [item.id, item]));
    expect(byId['find-players'].href).toBe('/apps/find-players');
    expect(byId['find-clubs'].href).toBe('/apps/find-clubs');
    expect(byId.rankings.href).toBe('/apps/rankings');
    expect(items.filter((item) => !item.ready).map((item) => item.id)).toEqual([]);
  });

  test('president catalog keeps club squad separate from market find players', () => {
    const groups = getMiniAppGroups('club');
    const marketIds = groups.find((g) => g.id === 'market').items.map((item) => item.id);
    const clubIds = groups.find((g) => g.id === 'club').items.map((item) => item.id);
    expect(marketIds).toEqual(expect.arrayContaining(['find-players', 'find-clubs', 'find-presidents']));
    expect(clubIds).toEqual(expect.arrayContaining(['club-players', 'contracts']));
  });
});
