import { readFileSync } from 'fs';
import { resolve } from 'path';
import { playerAvatarInitials, resolvePlayerAvatarUrl } from '../../lib/playerAvatar';

function read(rel) {
  return readFileSync(resolve(__dirname, rel), 'utf8');
}

describe('mobile transfer hub', () => {
  test('resolves hosted avatars and initials', () => {
    expect(resolvePlayerAvatarUrl({ avatar_url: 'https://cdn.example/a.png' })).toBe('https://cdn.example/a.png');
    expect(resolvePlayerAvatarUrl({ avatar_url: 'file:///tmp/x.png' })).toBe('');
    expect(playerAvatarInitials({ gamertag: 'creative' })).toBe('C');
  });

  test('transfers screen mounts the carousel hub instead of the old directory list', () => {
    const page = read('../../app/apps/transfers.jsx');
    expect(page).toMatch(/loadTransferMarket/);
    expect(page).toMatch(/TransferPlayerCarousel/);
    expect(page).toMatch(/TRANSFER HUB/);
    expect(page).toMatch(/viewMode/);
    expect(page).toMatch(/TransferFilters/);
    expect(page).toMatch(/TransferPlayerList/);
    expect(page).not.toMatch(/AppDirectoryScreen/);
  });
});
