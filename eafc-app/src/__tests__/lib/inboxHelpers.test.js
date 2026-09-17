import {
  getEffectiveInboxActionType,
  inboxMessageNeedsAction,
  isMatchCancelRequest,
  resolveNotificationHref,
  matchIdFromInboxMessage,
  groupInboxMessages,
  upsertInboxMessage,
  isNotificationUnread,
  applyNotificationRead,
} from '../../lib/inboxHelpers';

describe('inbox action types', () => {
  test('recovers match_invite action type when action_type missing', () => {
    expect(getEffectiveInboxActionType({ message_type: 'match_invite' })).toBe('accept_decline_date');
  });

  test('cancel requests require opponent accept/decline', () => {
    const message = { message_type: 'match_invite', metadata: { cancel_request: true }, status: 'pending' };
    expect(isMatchCancelRequest(message)).toBe(true);
    expect(getEffectiveInboxActionType(message)).toBe('accept_decline');
  });

  test('needs action only while pending', () => {
    expect(inboxMessageNeedsAction({ message_type: 'contract_offer', status: 'pending' })).toBe(true);
    expect(inboxMessageNeedsAction({ message_type: 'contract_offer', status: 'accepted' })).toBe(false);
  });

  test('result and dispute mails need Open Game Day while pending', () => {
    expect(getEffectiveInboxActionType({
      message_type: 'match_result',
      action_type: 'open_match',
    })).toBe('open_match');
    expect(getEffectiveInboxActionType({ message_type: 'match_dispute' })).toBe('open_match');
    expect(inboxMessageNeedsAction({
      message_type: 'match_result',
      action_type: 'open_match',
      status: 'pending',
    })).toBe(true);
    expect(inboxMessageNeedsAction({
      message_type: 'match_result',
      action_type: 'open_match',
      status: 'accepted',
    })).toBe(false);
  });

  test('tournament_schedule defaults to accept_decline', () => {
    expect(getEffectiveInboxActionType({ message_type: 'tournament_schedule' })).toBe('accept_decline');
  });

  test('maps loan inbox types to the same action types as web', () => {
    expect(getEffectiveInboxActionType({ message_type: 'loan_proposal' })).toBe('loan_parent_response');
    expect(getEffectiveInboxActionType({ message_type: 'loan_early_end' })).toBe('loan_early_end_response');
    expect(getEffectiveInboxActionType({ message_type: 'loan_purchase' })).toBe('loan_purchase_response');
    expect(getEffectiveInboxActionType({
      message_type: 'loan_proposal',
      action_type: 'loan_player_response',
    })).toBe('loan_player_response');
    expect(inboxMessageNeedsAction({ message_type: 'loan_proposal', status: 'pending' })).toBe(true);
    expect(inboxMessageNeedsAction({ message_type: 'loan_recalled', status: 'pending' })).toBe(false);
  });
});

describe('resolveNotificationHref', () => {
  test('maps /inbox?id= to mobile inbox detail route', () => {
    expect(resolveNotificationHref('/inbox?id=msg-9')).toEqual({
      pathname: '/apps/inbox/[id]',
      params: { id: 'msg-9' },
    });
  });

  test('maps legacy /messages links to inbox', () => {
    expect(resolveNotificationHref('/messages?id=abc')).toEqual({
      pathname: '/apps/inbox/[id]',
      params: { id: 'abc' },
    });
  });

  test('maps /game-day?match= to match detail', () => {
    expect(resolveNotificationHref('/game-day?match=abc')).toEqual({
      pathname: '/(tabs)/matches/matchdetailscreen',
      params: { matchId: 'abc' },
    });
  });
});

describe('matchIdFromInboxMessage', () => {
  test('reads match_id, related_entity_id, or link query', () => {
    expect(matchIdFromInboxMessage({ metadata: { match_id: 'm1' } })).toBe('m1');
    expect(matchIdFromInboxMessage({
      related_entity_type: 'match',
      related_entity_id: 'm2',
    })).toBe('m2');
    expect(matchIdFromInboxMessage({
      metadata: { link: '/game-day?match=m3' },
    })).toBe('m3');
  });
});

describe('groupInboxMessages', () => {
  test('buckets messages into Outlook-style sections', () => {
    const now = new Date('2026-08-10T15:00:00');
    const sections = groupInboxMessages([
      { id: '1', created_date: '2026-08-10T10:00:00', subject: 'Today' },
      { id: '2', created_date: '2026-08-09T10:00:00', subject: 'Yesterday' },
      { id: '3', created_date: '2026-08-05T10:00:00', subject: 'Week' },
      { id: '4', created_date: '2026-07-01T10:00:00', subject: 'Older' },
    ], now);

    expect(sections.map((s) => s.id)).toEqual(['today', 'yesterday', 'week', 'older']);
    expect(sections[0].messages.map((m) => m.id)).toEqual(['1']);
  });
});

describe('upsertInboxMessage', () => {
  test('upsert prepends a new id and does not reorder on update', () => {
    const newer = { id: 'new', created_date: '2026-09-13', subject: 'New' };
    const older = { id: 'old', created_date: '2026-01-01', subject: 'A' };
    expect(upsertInboxMessage([older], { type: 'create', id: 'new', data: newer })[0].id).toBe('new');
    const updated = { ...older, subject: 'A2' };
    const next = upsertInboxMessage([newer, older], { type: 'update', id: 'old', data: updated });
    expect(next.map((m) => m.id)).toEqual(['new', 'old']);
    expect(next[1].subject).toBe('A2');
  });
});

describe('groupInboxMessages create order', () => {
  test('sections by created_date, not updated_date bumps', () => {
    const now = new Date('2026-08-10T20:00:00');
    const sections = groupInboxMessages([
      { id: 'old', created_date: '2026-07-01T10:00:00', updated_date: '2026-08-10T19:00:00', subject: 'Old' },
      { id: 'fresh', created_date: '2026-08-10T09:00:00', subject: 'Fresh' },
    ], now);
    expect(sections[0].id).toBe('today');
    expect(sections[0].messages.map((m) => m.id)).toEqual(['fresh']);
    expect(sections.find((s) => s.id === 'older')?.messages.map((m) => m.id)).toEqual(['old']);
  });

  test('filters empty subject and body stubs', () => {
    const now = new Date('2026-08-10T20:00:00');
    const sections = groupInboxMessages([
      { id: 'real', created_date: '2026-08-10T09:00:00', subject: 'Hello' },
      { id: 'zombie', created_date: '2026-08-10T10:00:00', subject: '', body: '' },
    ], now);
    expect(sections[0].messages.map((m) => m.id)).toEqual(['real']);
  });
});

describe('isNotificationUnread', () => {
  test('supports read and is_read fields', () => {
    expect(isNotificationUnread({ is_read: false })).toBe(true);
    expect(isNotificationUnread({ read: true })).toBe(false);
  });

  test('treats mysql 0/1 read flags as unread/read', () => {
    expect(isNotificationUnread({ read: 0 })).toBe(true);
    expect(isNotificationUnread({ read: 1 })).toBe(false);
    expect(isNotificationUnread({ read: '0' })).toBe(true);
    expect(isNotificationUnread({ read: '1' })).toBe(false);
    expect(isNotificationUnread({ is_read: 1 })).toBe(false);
  });
});

describe('applyNotificationRead', () => {
  test('sets both mysql read and is_read', () => {
    expect(applyNotificationRead({ id: 'n1', read: 0 }, true)).toEqual({
      id: 'n1',
      read: 1,
      is_read: true,
    });
  });
});
