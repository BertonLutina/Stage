export const NOTIFICATION_SETTINGS = [
  { key: 'messages', label: 'Messages', description: 'Direct messages from other players' },
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
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
      return {};
    }
  }
  return typeof raw === 'object' ? raw : {};
}

export function isSettingOn(settings, key) {
  const val = settings?.[key];
  if (val === undefined || val === null) return true;
  return val === true || val === 1 || val === 'true' || val === '1';
}

export function getDefaultNotificationSettings() {
  const defaults = {};
  NOTIFICATION_SETTINGS.forEach((row) => { defaults[row.key] = true; });
  return defaults;
}

export function isNotificationEnabled(notificationType, userSettings) {
  const meta = NOTIFICATION_TYPES[notificationType];
  if (!meta) return true;
  return isSettingOn(parseNotificationSettings(userSettings), meta.settingKey);
}
