import { getMiniAppGroups } from '../../lib/miniApps';

describe('mini apps catalog', () => {
  test('does not duplicate native tab destinations', () => {
    const nativeHrefs = [
      '/(tabs)/dashboard',
      '/(tabs)/matches',
      '/(tabs)/tournaments',
      '/(tabs)/profile',
    ];
    for (const mode of ['player', 'club']) {
      const hrefs = getMiniAppGroups(mode).flatMap((group) => group.items.map((item) => item.href));
      for (const href of nativeHrefs) {
        expect(hrefs).not.toContain(href);
      }
    }
  });

  test('keeps extra STAGE apps that are not in the tab bar', () => {
    const playerIds = getMiniAppGroups('player').flatMap((group) => group.items.map((item) => item.id));
    expect(playerIds).toEqual(expect.arrayContaining(['inbox', 'disputes', 'competitions', 'wallet']));
    expect(playerIds).not.toEqual(expect.arrayContaining(['matches', 'tournaments', 'home', 'profile']));
  });
});
