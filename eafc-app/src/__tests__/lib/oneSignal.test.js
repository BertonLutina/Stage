import {
  isOneSignalConfigured,
  pathFromNotificationData,
  getNativePushStatus,
  syncOneSignalTags,
} from '../../lib/oneSignal';

describe('OneSignal mobile helpers', () => {
  test('is unconfigured without an app id', () => {
    expect(isOneSignalConfigured()).toBe(false);
  });

  test('reports push as unconfigured when the app id is missing', async () => {
    await expect(getNativePushStatus()).resolves.toEqual({
      configured: false,
      permission: false,
      optedIn: false,
    });
  });

  test('writes category tags onto the OneSignal user', () => {
    const { OneSignal } = require('react-native-onesignal');
    expect(syncOneSignalTags({ messages: false })).toBe(true);
    expect(OneSignal.User.addTags).toHaveBeenCalledWith(
      expect.objectContaining({ messages: 'false', contract_offers: 'true' }),
    );
  });

  test('maps Stage links to native screens', () => {
    expect(pathFromNotificationData({})).toBe('/apps/inbox');
    expect(pathFromNotificationData({ link: '/inbox?id=abc', related_id: 'abc' })).toEqual({
      pathname: '/apps/inbox/[id]',
      params: { id: 'abc' },
    });
    expect(pathFromNotificationData({ link: '/notifications' })).toBe('/apps/inbox');
    expect(pathFromNotificationData({ link: '/matches/game-day', match_id: 'm1' })).toEqual({
      pathname: '/(tabs)/matches/matchdetailscreen',
      params: { matchId: 'm1' },
    });
  });

  test('keeps ids embedded in notification links when additional data omits them', () => {
    expect(pathFromNotificationData({ link: '/inbox?id=msg-link' })).toEqual({
      pathname: '/apps/inbox/[id]',
      params: { id: 'msg-link' },
    });
    expect(pathFromNotificationData({ link: '/game-day?match=match-link' })).toEqual({
      pathname: '/(tabs)/matches/matchdetailscreen',
      params: { matchId: 'match-link' },
    });
    expect(pathFromNotificationData({ link: '/clubs/club-9' })).toEqual({
      pathname: '/apps/club/[id]',
      params: { id: 'club-9' },
    });
    expect(pathFromNotificationData({ link: '/tournaments/cup-9' })).toEqual({
      pathname: '/(tabs)/tournaments/tournamentdetailscreen',
      params: { tournamentId: 'cup-9' },
    });
    expect(pathFromNotificationData({ link: '/players/player-9' })).toEqual({
      pathname: '/(tabs)/profile/profilescreen',
      params: { playerId: 'player-9' },
    });
  });
});
