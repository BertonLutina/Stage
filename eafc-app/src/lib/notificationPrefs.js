import {
  getDefaultNotificationSettings,
  isChannelCategoryOn,
  materializeNotificationSettings,
  setChannelCategory,
} from './notificationTypes';

/**
 * The three columns of the Notification settings screen. The server stores four
 * channels (web, email, mobile, push); "In-app" is the web + mobile pair.
 */
export const CHANNEL_COLUMNS = [
  { key: 'inApp', channels: ['web', 'mobile'] },
  { key: 'push', channels: ['push'] },
  { key: 'email', channels: ['email'] },
];

function columnChannels(column) {
  const found = CHANNEL_COLUMNS.find((c) => c.key === column);
  return found ? found.channels : [];
}

export function isColumnOn(settings, column, categoryKey) {
  return columnChannels(column).some((channel) => isChannelCategoryOn(settings, channel, categoryKey));
}

export function setColumn(settings, column, categoryKey, value) {
  return columnChannels(column).reduce(
    (acc, channel) => setChannelCategory(acc, channel, categoryKey, value),
    materializeNotificationSettings(settings),
  );
}

export function mergeLoaded(raw) {
  return raw ? materializeNotificationSettings(raw) : getDefaultNotificationSettings();
}
