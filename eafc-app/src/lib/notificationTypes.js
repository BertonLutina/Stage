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

export function getDefaultNotificationSettings() {
  const defaults = {};
  NOTIFICATION_SETTINGS.forEach((row) => { defaults[row.key] = true; });
  return defaults;
}
