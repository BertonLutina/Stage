/**
 * Inbox action helpers — port of web `inboxActionTypes.js`.
 */

export function isMatchCancelRequest(message = {}) {
  return Boolean(parseInboxMetadata(message).cancel_request);
}

export function getEffectiveInboxActionType(message = {}) {
  if (isMatchCancelRequest(message)) return 'accept_decline';
  if (message.action_type && message.action_type !== 'none') return message.action_type;
  if (message.message_type === 'match_invite') return 'accept_decline_date';
  if (message.message_type === 'contract_offer') return 'contract_negotiation';
  if (message.message_type === 'trial_request') return 'trial_response';
  if (message.message_type === 'loan_proposal') return 'loan_parent_response';
  if (message.message_type === 'loan_early_end') return 'loan_early_end_response';
  if (message.message_type === 'loan_purchase') return 'loan_purchase_response';
  if (message.message_type === 'league_schedule') return 'schedule_accept_propose';
  return 'none';
}

export function inboxMessageNeedsAction(message = {}) {
  return getEffectiveInboxActionType(message) !== 'none' && (message.status || 'pending') === 'pending';
}

export function inboxMessageIsActioned(message = {}) {
  return getEffectiveInboxActionType(message) !== 'none' && (message.status || 'pending') !== 'pending';
}

export function parseInboxMetadata(message = {}) {
  const raw = message.metadata;
  if (!raw) return {};
  if (typeof raw === 'object') return raw;
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function normalizeNotificationPath(link) {
  let path = link.trim();
  if (/^https?:\/\//i.test(path)) {
    const url = new URL(path);
    path = `${url.pathname}${url.search}`;
  } else if (/^[a-z][a-z0-9+.-]*:\/\//i.test(path)) {
    const rest = path.replace(/^[a-z][a-z0-9+.-]*:\/\//i, '');
    path = rest.startsWith('/') ? rest : `/${rest}`;
  }
  if (!path.startsWith('/')) path = `/${path}`;
  return path.replace(/^\/messages(?=\?|\/|$)/, '/inbox');
}

/** Map a Stage web or app link onto a rebuilt Expo route. Unknown links return null. */
export function resolveNotificationHref(link) {
  if (!link || typeof link !== 'string') return null;
  const raw = link.trim();
  if (!raw) return null;

  let path;
  try {
    path = normalizeNotificationPath(raw);
  } catch {
    return null;
  }

  const queryIndex = path.indexOf('?');
  const query = queryIndex >= 0 ? path.slice(queryIndex + 1).split('#')[0] : '';
  const params = new URLSearchParams(query);
  const bare = (queryIndex >= 0 ? path.slice(0, queryIndex) : path.split('#')[0]).replace(/\/$/, '') || '/';

  if (bare === '/inbox' || bare.startsWith('/inbox/')) {
    const fromPath = bare === '/inbox' ? '' : decodeURIComponent(bare.slice('/inbox/'.length));
    const id = params.get('id') || fromPath;
    return id ? { pathname: '/apps/inbox/[id]', params: { id } } : { pathname: '/apps/inbox' };
  }

  if (bare === '/notifications') return { pathname: '/apps/inbox' };
  if (bare === '/schedule') return { pathname: '/(tabs)/matches' };
  if (bare === '/lifestyle') return { pathname: '/(tabs)/profile' };

  if (bare === '/game-day' || bare.startsWith('/matches') || bare === '/live' || bare.startsWith('/live/')) {
    const fromLive = bare.startsWith('/live/') ? decodeURIComponent(bare.slice('/live/'.length)) : '';
    const matchPath = bare.match(/^\/matches\/([^/]+)$/);
    const fromPath = matchPath && matchPath[1] !== 'game-day' ? decodeURIComponent(matchPath[1]) : '';
    const matchId = params.get('match') || params.get('matchId') || fromLive || fromPath;
    return matchId
      ? { pathname: '/(tabs)/matches/matchdetailscreen', params: { matchId } }
      : { pathname: '/(tabs)/matches' };
  }

  const club = bare.match(/^\/clubs\/([^/]+)/);
  if (club) return { pathname: '/apps/club/[id]', params: { id: decodeURIComponent(club[1]) } };

  const player = bare.match(/^\/players\/([^/]+)/);
  if (player) {
    return { pathname: '/(tabs)/profile/profilescreen', params: { playerId: decodeURIComponent(player[1]) } };
  }

  const tournament = bare.match(/^\/tournaments\/([^/]+)/);
  if (tournament) {
    return {
      pathname: '/(tabs)/tournaments/tournamentdetailscreen',
      params: { tournamentId: decodeURIComponent(tournament[1]) },
    };
  }

  if (bare === '/wallet') return { pathname: '/apps/wallet' };
  if (bare === '/store') return { pathname: '/apps/store' };
  if (bare === '/settings') return { pathname: '/apps/settings' };
  if (bare === '/transfers') return { pathname: '/apps/transfers' };
  if (bare.startsWith('/apps/')) return { pathname: bare };

  return null;
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
 * Outlook-style section groups: Today / Yesterday / Earlier this week / Older.
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

  messages.forEach((msg) => {
    const d = msg?.created_date ? new Date(msg.created_date) : null;
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

export function upsertInboxMessage(list = [], event) {
  if (!event) return list;
  if (event.type === 'delete') {
    return list.filter((m) => m.id !== event.id);
  }
  const data = event.data;
  if (!data?.id) return list;
  const idx = list.findIndex((m) => m.id === data.id);
  if (idx >= 0) {
    const next = list.slice();
    next[idx] = data;
    return next;
  }
  return [data, ...list];
}
