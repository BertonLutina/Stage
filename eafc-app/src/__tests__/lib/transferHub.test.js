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
    expect(page).toMatch(/<PageTitle/);
    expect(page).toMatch(/tileTitle="TRANSFER HUB"/);
    expect(page.match(/<PageTile\b[\s\S]*?>/)[0]).not.toMatch(/\beyebrow=/);
  });

  test('transfer hub chrome uses Game Day silver, not gold or cyan', () => {
    const hubFiles = [
      '../../app/apps/transfers.jsx',
      '../../components/transfer/transferHubTheme.js',
      '../../components/transfer/TransferPlayerCarousel.jsx',
      '../../components/transfer/TransferPlayerPhotoCard.jsx',
      '../../components/transfer/TransferPlayerList.jsx',
      '../../components/transfer/TransferFilters.jsx',
      '../../components/transfer/TransferBadge.jsx',
      '../../components/transfer/TransferWindowBanner.jsx',
      '../../components/transfer/TransferDetailSheet.jsx',
    ].map(read).join('\n');
    expect(hubFiles).toMatch(/SILVER/);
    expect(hubFiles).not.toMatch(/#f5c542/i);
    expect(hubFiles).not.toMatch(/#00e5ff/i);
    expect(hubFiles).not.toMatch(/#7cff6b/i);
    expect(hubFiles).not.toMatch(/rgba\(245,\s*197,\s*66/i);
    expect(hubFiles).not.toMatch(/rgba\(0,\s*229,\s*255/i);
    expect(hubFiles).not.toMatch(/rgba\(124,\s*255,\s*107/i);
  });
});
