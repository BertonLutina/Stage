import { isOneSignalConfigured, pathFromNotificationData } from '../../lib/oneSignal';

describe('OneSignal mobile helpers', () => {
  test('is unconfigured without an app id', () => {
    expect(isOneSignalConfigured()).toBe(false);
  });

  test('maps Stage links to native screens', () => {
    expect(pathFromNotificationData({})).toBe('/apps/notifications');
    expect(pathFromNotificationData({ link: '/inbox?id=abc', related_id: 'abc' })).toEqual({
      pathname: '/apps/inbox/[id]',
      params: { id: 'abc' },
    });
    expect(pathFromNotificationData({ link: '/notifications' })).toBe('/apps/notifications');
    expect(pathFromNotificationData({ link: '/matches/game-day', match_id: 'm1' })).toEqual({
      pathname: '/(tabs)/matches/matchdetailscreen',
      params: { matchId: 'm1' },
    });
  });
});
