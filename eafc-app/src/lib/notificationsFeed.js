import { isNotificationUnread, resolveNotificationHref } from '@/lib/inboxHelpers';
import { loadNotifications } from '@/lib/inboxData';

const DAY = 86400000;

function createdAt(row) {
  const time = new Date(row?.created_date || row?.created_at || 0).getTime();
  return Number.isNaN(time) ? 0 : time;
}

/** Newest first, with `unread`, `createdAt`, `href`. Text is the server's, never made up. */
export function prepareNotifications(rows = []) {
  return (rows || [])
    .map((row) => ({
      ...row,
      title: String(row.title || ''),
      body: String(row.body || row.message || ''),
      unread: isNotificationUnread(row),
      createdAt: createdAt(row),
      href: resolveNotificationHref(row.link),
    }))
    .sort((a, b) => b.createdAt - a.createdAt);
}

export function unreadCount(items = []) {
  return items.filter((n) => n.unread).length;
}

function startOfDay(ms) {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/** `[{ key: 'today' | 'week' | 'earlier', items }]`, empty groups removed. */
export function groupNotifications(items = [], now = Date.now()) {
  const today = startOfDay(now);
  const weekStart = today - 6 * DAY;
  const groups = { today: [], week: [], earlier: [] };
  items.forEach((n) => {
    if (n.createdAt >= today) groups.today.push(n);
    else if (n.createdAt >= weekStart) groups.week.push(n);
    else groups.earlier.push(n);
  });
  return ['today', 'week', 'earlier']
    .map((key) => ({ key, items: groups[key] }))
    .filter((g) => g.items.length > 0);
}

/** `21:58` today, `Mon` this week, `1 Oct` before. */
export function notificationTimeLabel(value, now = Date.now(), language = 'en', opts = {}) {
  const ms = new Date(value || 0).getTime();
  if (!value || Number.isNaN(ms)) return '';
  const locale = language === 'fr' ? 'fr-FR' : 'en-GB';
  const age = now - ms;
  const dayOf = (v) => new Date(v).toLocaleDateString('en-GB', opts);
  if (dayOf(ms) === dayOf(now)) {
    return new Date(ms).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit', hour12: false, ...opts });
  }
  if (age < 7 * DAY && age >= 0) {
    return new Date(ms).toLocaleDateString(locale, { weekday: 'short', ...opts }).replace('.', '');
  }
  return new Date(ms).toLocaleDateString(locale, { day: 'numeric', month: 'short', ...opts }).replace('.', '');
}

const ICON_RULES = [
  [/contract|offer|loan/, 'document-text-outline'],
  [/transfer|mercato/, 'swap-horizontal-outline'],
  [/tournament|competition|registration|league|season/, 'trophy-outline'],
  [/match|result|score|fixture|lineup/, 'football-outline'],
  [/message|chat/, 'chatbubble-outline'],
  [/club|join|invite/, 'shield-outline'],
  [/announce|news/, 'megaphone-outline'],
];

export function iconForType(type) {
  const key = String(type || '').toLowerCase();
  const hit = ICON_RULES.find(([pattern]) => pattern.test(key));
  return hit ? hit[1] : 'notifications-outline';
}

export async function loadNotificationsFeed() {
  const { notifications } = await loadNotifications();
  return prepareNotifications(notifications);
}
