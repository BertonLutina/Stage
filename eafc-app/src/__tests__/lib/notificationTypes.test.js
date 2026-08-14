import {
  getDefaultNotificationSettings,
  isNotificationEnabled,
  isSettingOn,
  parseNotificationSettings,
} from '../../lib/notificationTypes';

describe('notification settings (backend parity)', () => {
  test('defaults every known key to on', () => {
    const defaults = getDefaultNotificationSettings();
    expect(defaults.messages).toBe(true);
    expect(defaults.contract_offers).toBe(true);
    expect(defaults.announcements).toBe(true);
  });

  test('parses JSON strings from the player record', () => {
    expect(parseNotificationSettings('{"messages":false}')).toEqual({ messages: false });
    expect(parseNotificationSettings({ contract_offers: false })).toEqual({ contract_offers: false });
    expect(parseNotificationSettings('not-json')).toEqual({});
  });

  test('treats unset keys as on, matching server createNotificationIfEnabled', () => {
    expect(isSettingOn({}, 'messages')).toBe(true);
    expect(isSettingOn({ messages: false }, 'messages')).toBe(false);
    expect(isSettingOn({ messages: 'false' }, 'messages')).toBe(false);
    expect(isNotificationEnabled('contract_offer', { contract_offers: false })).toBe(false);
    expect(isNotificationEnabled('message', {})).toBe(true);
  });
});
