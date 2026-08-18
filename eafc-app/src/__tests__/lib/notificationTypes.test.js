import {
  getDefaultNotificationSettings,
  isNotificationEnabled,
  isSettingOn,
  parseNotificationSettings,
  isChannelCategoryOn,
  setChannelCategory,
} from '../../lib/notificationTypes';

describe('notification settings (backend parity)', () => {
  test('defaults every known key to on', () => {
    const defaults = getDefaultNotificationSettings();
    expect(defaults.messages).toBe(true);
    expect(defaults.contract_offers).toBe(true);
    expect(defaults.announcements).toBe(true);
    expect(defaults.email.messages).toBe(true);
    expect(defaults.mobile.messages).toBe(true);
    expect(defaults.push.messages).toBe(true);
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
    expect(isNotificationEnabled('message', { messages: false })).toBe(false);
  });

  test('nested email, mobile, and push channels are independent', () => {
    const settings = setChannelCategory({ messages: true }, 'email', 'messages', false);
    expect(isChannelCategoryOn(settings, 'email', 'messages')).toBe(false);
    expect(isChannelCategoryOn(settings, 'mobile', 'messages')).toBe(true);
    expect(isChannelCategoryOn(settings, 'push', 'messages')).toBe(true);
    expect(isNotificationEnabled('message', settings, 'email')).toBe(false);
    expect(isNotificationEnabled('message', settings, 'mobile')).toBe(true);
  });
});
