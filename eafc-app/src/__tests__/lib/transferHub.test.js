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
    // Task 11: the screen is the Mercato; the former hub is its "Free agents" tab.
    const page = read('../../app/apps/transfers.jsx');
    expect(page).toMatch(/FreeAgentsView/);
    expect(page).not.toMatch(/AppDirectoryScreen/);
    expect(page).toMatch(/SectionLabel/);
    expect(page).toMatch(/NewsTabs/);
    expect(page).toMatch(/stage\.mercato\.title/);
    const hub = read('../../components/mercato/FreeAgentsView.jsx');
    expect(hub).toMatch(/loadTransferMarket/);
    expect(hub).toMatch(/TransferPlayerCarousel/);
    expect(hub).toMatch(/viewMode/);
    expect(hub).toMatch(/TransferFilters/);
    expect(hub).toMatch(/TransferPlayerList/);
  });

  test('transfer hub chrome takes its colours from the Stage tokens', () => {
    const hubFiles = [
      '../../app/apps/transfers.jsx',
      '../../components/mercato/FreeAgentsView.jsx',
      '../../components/transfer/transferHubTheme.js',
      '../../components/transfer/TransferPlayerCarousel.jsx',
      '../../components/transfer/TransferPlayerPhotoCard.jsx',
      '../../components/transfer/TransferPlayerList.jsx',
      '../../components/transfer/TransferFilters.jsx',
      '../../components/transfer/TransferBadge.jsx',
      '../../components/transfer/TransferWindowBanner.jsx',
      '../../components/transfer/TransferDetailSheet.jsx',
    ].map(read).join('\n');
    expect(hubFiles).toMatch(/useThemeStore|stageTheme/);
    // The old silver palette (Game Day silver) is gone.
    expect(hubFiles).not.toMatch(/SILVER/);
    expect(hubFiles).not.toMatch(/CommandCenterUI/);
    expect(hubFiles).not.toMatch(/#[0-9a-f]{6}\b/i);
    expect(hubFiles).not.toMatch(/rgba\(\s*(?:238|248|244)\s*,/i);
  });
});
