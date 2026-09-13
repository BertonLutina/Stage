/**
 * Inbox action helpers — port of web `inboxActionTypes.js`.
 *
 * Real-inbox rules:
 * - Sort / group by latest activity (updated_date → created_date), not create-only.
 * - Socket create + update both bump the row to the top of the list.
 * - New match / Game Day events should arrive as distinct mails (see force_new on senders).
 */

export function parseInboxMetadata(message = {}) {
  const raw = message?.metadata;
  if (!raw) return {};
  if (typeof raw === 'object') return raw;
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export function isMatchCancelRequest(message = {}) {
  return Boolean(parseInboxMetadata(message).cancel_request);
}

export function getEffectiveInboxActionType(message = {}) {
  if (isMatchCancelRequest(message)) return 'accept_decline';
  if (message.action_type && message.action_type !== 'none') return message.action_type;

  const type = String(message.message_type || '');
  if (type === 'match_invite' || type === 'match_invitation') return 'accept_decline_date';
  if (type === 'contract_offer') return 'contract_negotiation';
  if (type === 'trial_request') return 'trial_response';
  if (type === 'loan_proposal') return 'loan_parent_response';
  if (type === 'loan_early_end') return 'loan_early_end_response';
  if (type === 'loan_purchase') return 'loan_purchase_response';
  if (type === 'league_schedule') return 'schedule_accept_propose';
  if (type === 'gameday_result' || type === 'match_result_action') return 'open_match';
  return 'none';
}

export function inboxMessageNeedsAction(message = {}) {
  return getEffectiveInboxActionType(message) !== 'none' && (message.status || 'pending') === 'pending';
}

export function inboxMessageIsActioned(message = {}) {
  return getEffectiveInboxActionType(message) !== 'none' && (message.status || 'pending') !== 'pending';
}

/** Latest activity timestamp (ms) for sorting / sectioning. */
export function inboxActivityAt(message = {}) {
  const candidates = [
    message.updated_date,
    message.updated_at,
    message.last_activity_at,
    message.bumped_at,
    message.created_date,
    message.created_at,
  ];
  let best = 0;
  candidates.forEach((value) => {
    if (!value) return;
    const ms = new Date(value).getTime();
    if (!Number.isNaN(ms) && ms > best) best = ms;
  });
  return best;
}

export function sortInboxByActivity(messages = []) {
  return [...messages].sort((a, b) => inboxActivityAt(b) - inboxActivityAt(a));
}

function matchIdFromLink(path = '') {
  try {
    const url = path.includes('://') ? new URL(path) : new URL(path, 'https://stage.local');
    return (
      url.searchParams.get('matchId')
      || url.searchParams.get('match_id')
      || null
    );
  } catch {
    const m = String(path).match(/matchId=([^&]+)/i) || String(path).match(/match_id=([^&]+)/i);
    return m?.[1] ? decodeURIComponent(m[1]) : null;
  }
}

/** Map web notification links to Expo routes. */
export function resolveNotificationHref(link) {
  if (!link || typeof link !== 'string') return null;
  let path = link.trim();
  if (!path) return null;
  path = path.replace(/^\/messages/, '/inbox');

  const inboxMatch = path.match(/^\/inbox(?:\?id=([^&]+))?/);
  if (inboxMatch) {
    const id = inboxMatch[1] ? decodeURIComponent(inboxMatch[1]) : null;
    return id ? { pathname: '/apps/inbox/[id]', params: { id } } : { pathname: '/apps/inbox' };
  }

  if (path.startsWith('/schedule') || path.startsWith('/game-day') || /matchdetailscreen/i.test(path)) {
    const matchId = matchIdFromLink(path);
    if (matchId) {
      return { pathname: '/(tabs)/matches/matchdetailscreen', params: { matchId } };
    }
    return { pathname: '/(tabs)/matches' };
  }
  if (path.startsWith('/apps/')) {
    return { pathname: path.split('?')[0] };
  }

  try {
    const url = path.includes('://') ? new URL(path) : new URL(path, 'https://stage.local');
    if (url.pathname.includes('inbox')) {
      const id = url.searchParams.get('id');
      return id
        ? { pathname: '/apps/inbox/[id]', params: { id } }
        : { pathname: '/apps/inbox' };
    }
  } catch {
    /* ignore */
  }

  return { pathname: '/apps/inbox' };
}

function isFlagOn(value) {
  return value === true || value === 1 || value === '1' || value === 'true';
}

export function isNotificationUnread(notif = {}) {
  if (notif.is_read !== undefined && notif.is_read !== null) return !isFlagOn(notif.is_read);
  if (notif.read !== undefined && notif.read !== null) return !isFlagOn(notif.read);
  return true;
}

export function notificationMarkReadPayload() {
  return { read: true };
}

export function applyNotificationRead(notif = {}, read = true) {
  return { ...notif, read: read ? 1 : 0, is_read: Boolean(read) };
}

const TYPE_LABELS = {
  match_invite: 'Match invite',
  match_invitation: 'Match invite',
  contract_offer: 'Contract',
  club_invite: 'Club invite',
  challenge: 'Challenge',
  announcement: 'Announcement',
  league_schedule: 'Schedule',
  trial_request: 'Trial',
  loan_proposal: 'Loan',
  loan_early_end: 'Loan return',
  loan_purchase: 'Loan buy',
  loan_recalled: 'Loan recall',
  loan_terminated_early: 'Loan ended',
  gameday_result: 'Game Day',
  match_result_action: 'Game Day',
  general: 'Message',
};

export function inboxTypeLabel(messageType) {
  return TYPE_LABELS[messageType] || TYPE_LABELS.general;
}

export function senderInitials(message = {}) {
  if (message.is_system) return 'ST';
  const name = String(message.sender_gamertag || message.sender_email || '?').trim();
  const parts = name.split(/[\s._@-]+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

export function previewSnippet(body, max = 90) {
  const text = String(body || '').replace(/\s+/g, ' ').trim();
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1)}…`;
}

export function formatRelativeInboxTime(dateValue, now = new Date()) {
  const d = dateValue ? new Date(dateValue) : null;
  if (!d || Number.isNaN(d.getTime())) return '';
  const diffMs = now.getTime() - d.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

/**
 * Outlook-style section groups by latest activity.
 * Within each section, newest activity first.
 */
export function groupInboxMessages(messages = [], now = new Date()) {
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startYesterday = new Date(startToday);
  startYesterday.setDate(startYesterday.getDate() - 1);
  const startWeek = new Date(startToday);
  startWeek.setDate(startWeek.getDate() - 6);

  const buckets = {
    today: [],
    yesterday: [],
    week: [],
    older: [],
  };

  sortInboxByActivity(messages).forEach((msg) => {
    const ms = inboxActivityAt(msg);
    const d = ms ? new Date(ms) : null;
    if (!d || Number.isNaN(d.getTime())) {
      buckets.older.push(msg);
      return;
    }
    if (d >= startToday) buckets.today.push(msg);
    else if (d >= startYesterday) buckets.yesterday.push(msg);
    else if (d >= startWeek) buckets.week.push(msg);
    else buckets.older.push(msg);
  });

  const sections = [];
  if (buckets.today.length) sections.push({ id: 'today', label: 'Today', messages: buckets.today });
  if (buckets.yesterday.length) sections.push({ id: 'yesterday', label: 'Yesterday', messages: buckets.yesterday });
  if (buckets.week.length) sections.push({ id: 'week', label: 'Earlier this week', messages: buckets.week });
  if (buckets.older.length) sections.push({ id: 'older', label: 'Older', messages: buckets.older });
  return sections;
}

/**
 * Insert or refresh a message and always bump it to the top.
 * Updates must not stay buried at their old index.
 */
export function upsertInboxMessage(list = [], event) {
  if (!event) return list;
  if (event.type === 'delete') {
    return list.filter((m) => m.id !== event.id);
  }
  const data = event.data;
  if (!data?.id) return list;
  const without = list.filter((m) => m.id !== data.id);
  const stamped = {
    ...data,
    updated_date: data.updated_date || data.last_activity_at || new Date().toISOString(),
  };
  return [stamped, ...without];
}
