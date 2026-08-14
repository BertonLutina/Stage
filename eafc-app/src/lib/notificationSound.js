export const SYSTEM_NOTIFICATION_SOUND = 'default';

/** Phone lock-screen / banner alerts use the device notification sound. */
export function getSelectedNotificationSoundId() {
  return SYSTEM_NOTIFICATION_SOUND;
}

export function setSelectedNotificationSoundId() {
  return SYSTEM_NOTIFICATION_SOUND;
}
