import {
  getSelectedNotificationSoundId,
  setSelectedNotificationSoundId,
  SYSTEM_NOTIFICATION_SOUND,
} from '../../lib/notificationSound';

describe('notification sound', () => {
  test('always uses the phone default tone', () => {
    expect(getSelectedNotificationSoundId()).toBe(SYSTEM_NOTIFICATION_SOUND);
    expect(setSelectedNotificationSoundId('whistle')).toBe('default');
    expect(getSelectedNotificationSoundId()).toBe('default');
  });
});
