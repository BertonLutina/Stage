import {
  getEffectiveInboxActionType,
  inboxMessageNeedsAction,
  isMatchCancelRequest,
  resolveNotificationHref,
  groupInboxMessages,
  upsertInboxMessage,
  isNotificationUnread,
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
});

describe('groupInboxMessages', () => {
  test('buckets messages into Outlook-style sections', () => {
    const now = new Date('2026-08-10T15:00:00');
    const sections = groupInboxMessages([
      { id: '1', created_date: '2026-08-10T10:00:00' },
      { id: '2', created_date: '2026-08-09T10:00:00' },
      { id: '3', created_date: '2026-08-05T10:00:00' },
      { id: '4', created_date: '2026-07-01T10:00:00' },
    ], now);

    expect(sections.map((s) => s.id)).toEqual(['today', 'yesterday', 'week', 'older']);
    expect(sections[0].messages.map((m) => m.id)).toEqual(['1']);
  });
});

describe('upsertInboxMessage', () => {
  test('prepends create and replaces update by id', () => {
    const a = { id: '1', subject: 'A' };
    const updated = { id: '1', subject: 'A2' };
    const b = { id: '2', subject: 'B' };
    expect(upsertInboxMessage([a], { type: 'create', id: '2', data: b })[0].id).toBe('2');
    expect(upsertInboxMessage([a], { type: 'update', id: '1', data: updated })[0].subject).toBe('A2');
  });
});

describe('isNotificationUnread', () => {
  test('supports read and is_read fields', () => {
    expect(isNotificationUnread({ is_read: false })).toBe(true);
    expect(isNotificationUnread({ read: true })).toBe(false);
  });
});
