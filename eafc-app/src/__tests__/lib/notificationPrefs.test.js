import {
  CHANNEL_COLUMNS,
  isColumnOn,
  setColumn,
  mergeLoaded,
} from '../../lib/notificationPrefs';
import { getDefaultNotificationSettings, isChannelCategoryOn } from '../../lib/notificationTypes';

describe('notificationPrefs', () => {
  test('exposes In-app, Push and Email columns', () => {
    expect(CHANNEL_COLUMNS.map((c) => c.key)).toEqual(['inApp', 'push', 'email']);
  });

  test('everything is on by default', () => {
    const settings = getDefaultNotificationSettings();
    expect(isColumnOn(settings, 'inApp', 'messages')).toBe(true);
    expect(isColumnOn(settings, 'push', 'messages')).toBe(true);
    expect(isColumnOn(settings, 'email', 'messages')).toBe(true);
  });

  test('In-app is on when web or mobile is on', () => {
    let settings = getDefaultNotificationSettings();
    settings = setColumn(settings, 'inApp', 'match_results', false);
    expect(isColumnOn(settings, 'inApp', 'match_results')).toBe(false);
    // flip only one of the two underlying channels
    settings = { ...settings, mobile: { ...settings.mobile, match_results: true } };
    expect(isColumnOn(settings, 'inApp', 'match_results')).toBe(true);
  });

  test('turning In-app on or off writes both web and mobile', () => {
    const off = setColumn(getDefaultNotificationSettings(), 'inApp', 'messages', false);
    expect(isChannelCategoryOn(off, 'web', 'messages')).toBe(false);
    expect(isChannelCategoryOn(off, 'mobile', 'messages')).toBe(false);
    expect(off.messages).toBe(false);
    const on = setColumn(off, 'inApp', 'messages', true);
    expect(isChannelCategoryOn(on, 'web', 'messages')).toBe(true);
    expect(isChannelCategoryOn(on, 'mobile', 'messages')).toBe(true);
  });

  test('push and email only touch their own channel', () => {
    const next = setColumn(getDefaultNotificationSettings(), 'push', 'club_updates', false);
    expect(isChannelCategoryOn(next, 'push', 'club_updates')).toBe(false);
    expect(isChannelCategoryOn(next, 'email', 'club_updates')).toBe(true);
    expect(isChannelCategoryOn(next, 'web', 'club_updates')).toBe(true);
    const mail = setColumn(next, 'email', 'club_updates', false);
    expect(isChannelCategoryOn(mail, 'email', 'club_updates')).toBe(false);
    expect(isChannelCategoryOn(mail, 'push', 'club_updates')).toBe(false);
  });

  test('setColumn does not mutate its input', () => {
    const base = getDefaultNotificationSettings();
    setColumn(base, 'email', 'messages', false);
    expect(isChannelCategoryOn(base, 'email', 'messages')).toBe(true);
  });

  test('mergeLoaded fills missing categories with on and parses JSON strings', () => {
    const merged = mergeLoaded(JSON.stringify({ email: { messages: false } }));
    expect(isColumnOn(merged, 'email', 'messages')).toBe(false);
    expect(isColumnOn(merged, 'email', 'announcements')).toBe(true);
    expect(mergeLoaded(null)).toEqual(getDefaultNotificationSettings());
  });
});
