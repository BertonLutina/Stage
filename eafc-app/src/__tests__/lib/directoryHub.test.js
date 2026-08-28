import { readFileSync } from 'fs';
import { resolve } from 'path';
import { filterClubDirectory, filterPlayerDirectory } from '../../lib/stageDirectories';

function read(rel) {
  return readFileSync(resolve(__dirname, rel), 'utf8');
}

describe('find players and find clubs hubs', () => {
  test('find players uses list boxes, carousel and list instead of radio chips', () => {
    const page = read('../../app/apps/find-players.jsx');
    expect(page).toMatch(/loadPlayerDirectory/);
    expect(page).toMatch(/FilterListBox/);
    expect(page).toMatch(/DirectoryCarousel/);
    expect(page).toMatch(/DirectoryPlayerList/);
    expect(page).toMatch(/viewMode/);
    expect(page).toMatch(/OVR_FLOOR_OPTIONS/);
    expect(page).toMatch(/minOvr/);
    expect(page).toMatch(/opponentKind: 'player'/);
    expect(page).not.toMatch(/FilterChips/);
    expect(page).not.toMatch(/AppDirectoryScreen/);
  });

  test('find clubs mirrors the same hub chrome', () => {
    const page = read('../../app/apps/find-clubs.jsx');
    expect(page).toMatch(/loadClubDirectory/);
    expect(page).toMatch(/FilterListBox/);
    expect(page).toMatch(/DirectoryCarousel/);
    expect(page).toMatch(/DirectoryClubList/);
    expect(page).toMatch(/viewMode/);
    expect(page).toMatch(/OVR_FLOOR_OPTIONS/);
    expect(page).toMatch(/minOvr/);
    expect(page).toMatch(/opponentKind: 'club'/);
    expect(page).not.toMatch(/FilterChips/);
    expect(page).not.toMatch(/AppDirectoryScreen/);
  });

  test('OVR filter is a minimum, and blank/zero OVR counts as 70', () => {
    const players = [
      { id: 'high', gamertag: 'A', overall_rating: 91 },
      { id: 'mid', gamertag: 'B', overall_rating: 80 },
      { id: 'blank', gamertag: 'C', overall_rating: 0 },
    ];
    expect(filterPlayerDirectory(players, { minOvr: '85' }).map((p) => p.id)).toEqual(['high']);
    expect(filterPlayerDirectory(players, { minOvr: '80' }).map((p) => p.id)).toEqual(['high', 'mid']);
    expect(filterPlayerDirectory(players, { minOvr: '70' }).map((p) => p.id)).toEqual(['high', 'mid', 'blank']);
    expect(filterClubDirectory(
      [
        { id: 'c1', name: 'Ajax', overall_rating: 88 },
        { id: 'c2', name: 'Galaxy', rating: 1500 },
      ],
      { minOvr: '85' },
    ).map((c) => c.id)).toEqual(['c1', 'c2']);
  });
});
