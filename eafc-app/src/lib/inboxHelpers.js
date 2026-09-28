/**
 * Inbox action helpers — port of web `inboxActionTypes.js`.
 *
 * Mailbox rules:
 * - New event = new id → prepend. Same id update → replace in place (no reorder).
 * - List order is created_date desc. Do not sort by updated_date.
 * - Empty subject+body stubs are filtered out (hasInboxContent).
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
  if (type === 'tournament_schedule') return 'accept_decline';
  if (
    type === 'match_result'
    || type === 'match_dispute'
    || type === 'gameday_result'
    || type === 'match_result_action'
  ) {
    return 'open_match';
  }
  return 'none';
}

export function inboxMessageNeedsAction(message = {}) {
  return getEffectiveInboxActionType(message) !== 'none' && (message.status || 'pending') === 'pending';
}

export function inboxMessageIsActioned(message = {}) {
  return getEffectiveInboxActionType(message) !== 'none' && (message.status || 'pending') !== 'pending';
}

/** created_date timestamp (ms) for list order / sectioning. */
export function inboxCreatedAt(message = {}) {
  const value = message.created_date || message.created_at;
  if (!value) return 0;
  const ms = new Date(value).getTime();
  return Number.isNaN(ms) ? 0 : ms;
}

/** @deprecated Prefer inboxCreatedAt — mailbox sorts by create, not bump. */
export function inboxActivityAt(message = {}) {
  return inboxCreatedAt(message);
}

export function sortInboxByCreatedDate(messages = []) {
  return [...messages].sort((a, b) => inboxCreatedAt(b) - inboxCreatedAt(a));
}

/** @deprecated Prefer sortInboxByCreatedDate. */
export function sortInboxByActivity(messages = []) {
  return sortInboxByCreatedDate(messages);
}

/** Drop zombie stubs with neither subject nor body (mirrors Stage web). */
export function hasInboxContent(message = {}) {
  const subject = String(message.subject || '').trim();
  const body = String(message.body || '').trim();
  return Boolean(subject || body);
}

function matchIdFromLink(path = '') {
  try {
    const url = path.includes('://') ? new URL(path) : new URL(path, 'https://stage.local');
    return (
      url.searchParams.get('match')
      || url.searchParams.get('matchId')
      || url.searchParams.get('match_id')
      || null
    );
  } catch {
    const m = String(path).match(/[?&]match(?:Id|_id)?=([^&]+)/i);
    return m?.[1] ? decodeURIComponent(m[1]) : null;
  }
}

/** Resolve Game Day match id from result / dispute mail. */
export function matchIdFromInboxMessage(message = {}) {
  const meta = parseInboxMetadata(message);
  return (
    meta.match_id
    || meta.matchId
    || (message.related_entity_type === 'match' ? message.related_entity_id : null)
    || matchIdFromLink(meta.link || '')
    || null
  );
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
  match_result: 'Game Day',
  match_dispute: 'Game Day',
  tournament_schedule: 'Tournament',
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
 * Outlook-style section groups by created_date.
 * Within each section, newest create first.
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

  sortInboxByCreatedDate(messages.filter(hasInboxContent)).forEach((msg) => {
    const ms = inboxCreatedAt(msg);
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
 * Create: prepend unknown id.
 * Update: replace same id in place — do not jump above newer mails.
 */
export function upsertInboxMessage(list = [], event) {
  if (!event) return list;
  if (event.type === 'delete') {
    return list.filter((m) => m.id !== event.id);
  }
  const data = event.data;
  if (!data?.id) return list;

  const existingIndex = list.findIndex((m) => m.id === data.id);
  if (existingIndex === -1) {
    return [data, ...list];
  }

  const next = list.slice();
  next[existingIndex] = { ...list[existingIndex], ...data };
  return next;
}
