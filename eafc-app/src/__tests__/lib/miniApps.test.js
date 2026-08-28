import { getMiniAppGroups } from '../../lib/miniApps';

describe('mini apps catalog', () => {
  test('keeps only phone destinations', () => {
    const ids = getMiniAppGroups('player').flatMap((group) => group.items).map((item) => item.id);
    expect(ids).toEqual([
      'find-players',
      'find-clubs',
      'transfers',
      'inbox',
      'store',
      'wallet',
      'settings',
    ]);
  });

  test('player and president see the same short catalog', () => {
    const player = getMiniAppGroups('player').flatMap((g) => g.items).map((i) => i.id);
    const president = getMiniAppGroups('club').flatMap((g) => g.items).map((i) => i.id);
    expect(president).toEqual(player);
    expect(player).not.toEqual(expect.arrayContaining([
      'rankings',
      'lifestyle',
      'scouting',
      'news',
      'discord',
      'contracts',
      'free-agents',
    ]));
  });

  test('does not duplicate native tab destinations', () => {
    for (const mode of ['player', 'club']) {
      const items = getMiniAppGroups(mode).flatMap((group) => group.items);
      const bareNative = items.filter((item) => (
        ['/(tabs)/dashboard', '/(tabs)/matches', '/(tabs)/tournaments', '/(tabs)/profile'].includes(item.href)
      ));
      expect(bareNative).toEqual([]);
    }
  });
});
