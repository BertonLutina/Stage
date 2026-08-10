/**
 * Inbox action helpers — port of web `inboxActionTypes.js`.
 */

export function getEffectiveInboxActionType(message = {}) {
  if (message.action_type && message.action_type !== 'none') return message.action_type;
  if (message.message_type === 'match_invite') return 'accept_decline_date';
  if (message.message_type === 'contract_offer') return 'contract_negotiation';
  if (message.message_type === 'trial_request') return 'trial_response';
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

  if (path.startsWith('/schedule')) return { pathname: '/apps/schedule' };
  if (path.startsWith('/apps/')) {
    return { pathname: path.split('?')[0] };
  }

  // Fallback: try inbox if link contains inbox message id query
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

export function isNotificationUnread(notif = {}) {
  if (typeof notif.is_read === 'boolean') return !notif.is_read;
  if (typeof notif.read === 'boolean') return !notif.read;
  return true;
}

export function notificationMarkReadPayload(notif = {}) {
  if ('is_read' in notif || !('read' in notif)) return { is_read: true };
  return { read: true };
}

const TYPE_LABELS = {
  match_invite: 'Match invite',
  contract_offer: 'Contract',
  club_invite: 'Club invite',
  challenge: 'Challenge',
  announcement: 'Announcement',
  league_schedule: 'Schedule',
  trial_request: 'Trial',
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
