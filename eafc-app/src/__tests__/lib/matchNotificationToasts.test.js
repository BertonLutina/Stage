import {
  createToastDedupe,
  matchParticipantSide,
  notificationEmailsForUser,
  toastFromInbox,
  toastFromMatchUpdate,
  toastFromNotification,
} from '../../lib/matchNotificationToasts';

const identity = {
  playerId: 'p-away',
  clubId: 'club-away',
  emails: ['away@example.test'],
};

const match = {
  id: 'match-1',
  status: 'scheduled',
  home_club_id: 'club-home',
  away_club_id: 'club-away',
  home_club_name: 'Home FC',
  away_club_name: 'Away FC',
  away_player_id: 'p-away',
  away_player_email: 'away@example.test',
  result_home_submitted: 0,
  result_away_submitted: 0,
};

describe('match fixture toasts', () => {
  test('collects user, player, and club emails for notification rooms', () => {
    expect(notificationEmailsForUser({
      user: { email: 'Alex@Stage.test' },
      player: { email: 'player@stage.test' },
      club: { owner_email: 'owner@stage.test' },
    })).toEqual(['alex@stage.test', 'player@stage.test', 'owner@stage.test']);
  });

  test('treats the seated away player as a participant', () => {
    expect(matchParticipantSide(match, identity)).toBe('away');
    expect(matchParticipantSide(match, { emails: ['other@test'] })).toBe(null);
  });

  test('toasts kickoff, submit-score, and dispute transitions', () => {
    expect(toastFromMatchUpdate({ ...match, status: 'in_progress' }, match, identity, {})).toBe(
      'Kickoff · Home FC vs Away FC is underway.'
    );
    expect(toastFromMatchUpdate({
      ...match,
      status: 'in_progress',
      result_home_submitted: 1,
    }, { ...match, status: 'in_progress' }, identity, {})).toBe(
      'Result submitted - your turn · Home FC vs Away FC. Upload your screenshot and confirm the score.'
    );
    expect(toastFromMatchUpdate({ ...match, status: 'disputed' }, { ...match, status: 'in_progress' }, identity, {})).toBe(
      'Match result disputed · Admin is reviewing the submitted screenshots and scores.'
    );
  });

  test('does not toast a live match on first snapshot', () => {
    expect(toastFromMatchUpdate({ ...match, status: 'in_progress' }, null, identity, {})).toBe(null);
  });

  test('notification and inbox events become toast copy', () => {
    expect(toastFromNotification({
      type: 'create',
      data: { type: 'match_reminder', title: 'Kickoff', body: 'Home FC vs Away FC is underway.', read: 0 },
    }, {})).toBe('Kickoff · Home FC vs Away FC is underway.');
    expect(toastFromInbox({
      type: 'create',
      data: { message_type: 'match_invite', subject: 'Match invite: Neo vs You' },
    }, {})).toBe('Match invite: Neo vs You');
    expect(toastFromNotification({
      type: 'create',
      data: { type: 'match_reminder', title: 'Kickoff', read: 0 },
    }, { mobile: { match_reminders: false } })).toBe(null);
  });

  test('dedupes the same toast for a few seconds', () => {
    const allow = createToastDedupe(10_000);
    expect(allow('Kickoff · Home FC vs Away FC is underway.')).toBe(true);
    expect(allow('Kickoff · Home FC vs Away FC is underway.')).toBe(false);
    expect(allow('Result submitted - your turn')).toBe(true);
  });
});
