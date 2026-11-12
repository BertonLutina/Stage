import { getMiniAppGroups } from '../../lib/miniApps';

describe('mini apps catalog', () => {
  test('keeps the Apps mockup groups (Club / Compete / Account)', () => {
    const groups = getMiniAppGroups('player');
    expect(groups.map((g) => g.id)).toEqual(['club', 'compete', 'account']);
    const ids = groups.flatMap((group) => group.items).map((item) => item.id);
    expect(ids).toEqual([
      'my-club',
      'inbox',
      'transfers',
      'find-players',
      'competitions',
      'leagues',
      'find-clubs',
      'register',
      'wallet',
      'store',
      'settings',
      'news',
      'lifestyle',
    ]);
  });

  test('player and president see the same short catalog', () => {
    const player = getMiniAppGroups('player').flatMap((g) => g.items).map((i) => i.id);
    const president = getMiniAppGroups('club').flatMap((g) => g.items).map((i) => i.id);
    expect(president).toEqual(player);
    expect(player).not.toEqual(expect.arrayContaining([
      'rankings',
      'scouting',
      'discord',
      'contracts',
      'free-agents',
    ]));
  });

  test('native-tab deep links stay only when keepOnNativeTab is set', () => {
    for (const mode of ['player', 'club']) {
      const items = getMiniAppGroups(mode).flatMap((group) => group.items);
      const native = items.filter((item) => (
        ['/(tabs)/dashboard', '/(tabs)/matches', '/(tabs)/tournaments', '/(tabs)/profile'].includes(item.href)
      ));
      expect(native.every((item) => item.keepOnNativeTab)).toBe(true);
      expect(native.map((item) => item.id)).toEqual(['leagues']);
    }
  });
});
