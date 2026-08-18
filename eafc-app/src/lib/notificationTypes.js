export const NOTIFICATION_SETTINGS = [
  { key: 'messages', label: 'Messages', description: 'Direct messages, match chat, and club chat' },
  { key: 'contract_offers', label: 'Contract offers', description: 'When someone offers you a contract' },
  { key: 'contract_updates', label: 'Contract updates', description: 'Accepted, rejected, terminated contracts' },
  { key: 'match_reminders', label: 'Match reminders', description: 'Upcoming scheduled matches' },
  { key: 'match_results', label: 'Match results', description: 'Match outcomes and confirmations' },
  { key: 'club_updates', label: 'Club updates', description: 'Join requests, approvals, and invites' },
  { key: 'tournament_updates', label: 'Tournament updates', description: 'Tournament starts and completions' },
  { key: 'announcements', label: 'Announcements', description: 'Platform news and announcements' },
];

export const NOTIFICATION_SETTING_GROUPS = [
  { label: 'Social', keys: ['messages'] },
  { label: 'Contracts', keys: ['contract_offers', 'contract_updates'] },
  { label: 'Matches', keys: ['match_reminders', 'match_results'] },
  { label: 'Club', keys: ['club_updates'] },
  { label: 'Tournaments', keys: ['tournament_updates'] },
  { label: 'General', keys: ['announcements'] },
];

export const NOTIFICATION_CHANNEL_KEYS = ['web', 'email', 'mobile', 'push'];

export const NOTIFICATION_CHANNELS = [
  {
    key: 'email',
    label: 'Email notifications',
    description: 'Sent to your account email.',
  },
  {
    key: 'mobile',
    label: 'Mobile notifications',
    description: 'In-app toasts and the notification list on your phone.',
  },
  {
    key: 'push',
    label: 'Push notifications',
    description: 'Lock screen and banner alerts on this device.',
  },
];

export const NOTIFICATION_TYPES = {
  contract_offer: { settingKey: 'contract_offers' },
  contract_accepted: { settingKey: 'contract_updates' },
  contract_rejected: { settingKey: 'contract_updates' },
  contract_terminated: { settingKey: 'contract_updates' },
  contract_expired: { settingKey: 'contract_updates' },
  contract_completed: { settingKey: 'contract_updates' },
  match_scheduled: { settingKey: 'match_reminders' },
  match_result: { settingKey: 'match_results' },
  match_reminder: { settingKey: 'match_reminders' },
  result_submitted: { settingKey: 'match_results' },
  result_confirmed: { settingKey: 'match_results' },
  join_request: { settingKey: 'club_updates' },
  join_approved: { settingKey: 'club_updates' },
  join_rejected: { settingKey: 'club_updates' },
  club_update: { settingKey: 'club_updates' },
  invite: { settingKey: 'club_updates' },
  message: { settingKey: 'messages' },
  tournament_start: { settingKey: 'tournament_updates' },
  tournament_complete: { settingKey: 'tournament_updates' },
  announcement: { settingKey: 'announcements' },
};

export function parseNotificationSettings(raw) {
  if (!raw) return {};
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
    } catch {
      return {};
    }
  }
  return typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
}

export function isSettingOn(settings, key) {
  const val = settings?.[key];
  if (val === undefined || val === null) return true;
  return val === true || val === 1 || val === 'true' || val === '1';
}

export function isChannelCategoryOn(settings, channel, categoryKey) {
  const parsed = parseNotificationSettings(settings);
  const nested = parsed?.[channel];
  if (nested && typeof nested === 'object' && !Array.isArray(nested) && Object.prototype.hasOwnProperty.call(nested, categoryKey)) {
    return isSettingOn(nested, categoryKey);
  }
  return isSettingOn(parsed, categoryKey);
}

export function materializeNotificationSettings(raw) {
  const parsed = parseNotificationSettings(raw);
  const next = { ...parsed };
  for (const channel of NOTIFICATION_CHANNEL_KEYS) {
    const nested = {};
    for (const row of NOTIFICATION_SETTINGS) {
      nested[row.key] = isChannelCategoryOn(parsed, channel, row.key);
    }
    next[channel] = nested;
  }
  for (const row of NOTIFICATION_SETTINGS) {
    next[row.key] = next.web[row.key];
  }
  return next;
}

export function getDefaultNotificationSettings() {
  const categories = {};
  NOTIFICATION_SETTINGS.forEach((row) => { categories[row.key] = true; });
  return materializeNotificationSettings(categories);
}

export function setChannelCategory(settings, channel, categoryKey, value) {
  const current = materializeNotificationSettings(settings);
  const nested = { ...(current[channel] || {}), [categoryKey]: Boolean(value) };
  const next = { ...current, [channel]: nested };
  if (channel === 'web') next[categoryKey] = Boolean(value);
  return next;
}

export function isNotificationEnabled(notificationType, userSettings, channel = 'web') {
  const meta = NOTIFICATION_TYPES[notificationType];
  if (!meta) return true;
  return isChannelCategoryOn(userSettings, channel, meta.settingKey);
}
