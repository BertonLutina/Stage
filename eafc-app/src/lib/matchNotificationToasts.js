import { isNotificationEnabled } from './notificationTypes';

export function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

export function notificationEmailsForUser({ user, player, club } = {}) {
  return [...new Set([
    user?.email,
    player?.email,
    club?.owner_email,
  ].map(normalizeEmail).filter(Boolean))];
}

export function idsEqual(a, b) {
  return Boolean(a && b && String(a) === String(b));
}

export function emailsEqual(a, b) {
  const left = normalizeEmail(a);
  const right = normalizeEmail(b);
  return Boolean(left && right && left === right);
}

export function matchParticipantSide(match, identity = {}) {
  if (!match) return null;
  const { playerId, clubId, emails = [] } = identity;
  const mine = emails.map(normalizeEmail).filter(Boolean);

  const isHome = idsEqual(playerId, match.home_player_id)
    || idsEqual(clubId, match.home_club_id)
    || mine.some((email) => (
      emailsEqual(email, match.home_player_email)
      || emailsEqual(email, match.home_owner_email)
    ));
  if (isHome) return 'home';

  const isAway = idsEqual(playerId, match.away_player_id)
    || idsEqual(clubId, match.away_club_id)
    || mine.some((email) => (
      emailsEqual(email, match.away_player_email)
      || emailsEqual(email, match.away_owner_email)
    ));
  return isAway ? 'away' : null;
}

export function matchLabel(match) {
  const home = match?.home_club_name || match?.home_player_name || 'Home';
  const away = match?.away_club_name || match?.away_player_name || 'Away';
  return `${home} vs ${away}`;
}

export function toastText(title, body) {
  const head = String(title || '').trim();
  const rest = String(body || '').trim();
  if (head && rest && !head.includes(rest.slice(0, 24))) return `${head} · ${rest}`;
  return head || rest || '';
}

export function toastFromNotification(event, settings) {
  const data = event?.data;
  if (!data) return null;
  if (event.type !== 'create' && event.type !== 'update') return null;
  if (data.read === true || data.read === 1) return null;
  if (!isNotificationEnabled(data.type, settings, 'mobile')) return null;
  return toastText(data.title || 'New notification', data.body);
}

export function toastFromInbox(event, settings) {
  const data = event?.data;
  if (event?.type !== 'create' || !data) return null;
  const type = data.message_type || data.type || 'message';
  if (!isNotificationEnabled(type, settings, 'mobile')) return null;
  return toastText(data.subject || 'New inbox message', data.body);
}

export function toastFromMatchUpdate(match, previous, identity, settings) {
  if (!match?.id || !previous?.id) return null;
  if (String(match.id) !== String(previous.id)) return null;
  const side = matchParticipantSide(match, identity);
  if (!side) return null;

  const label = matchLabel(match);

  if (match.status === 'in_progress' && previous.status !== 'in_progress') {
    if (!isNotificationEnabled('match_reminder', settings, 'mobile')) return null;
    return toastText('Kickoff', `${label} is underway.`);
  }

  if (match.status === 'disputed' && previous.status !== 'disputed') {
    if (!isNotificationEnabled('match_disputed', settings, 'mobile')) return null;
    return toastText('Match result disputed', 'Admin is reviewing the submitted screenshots and scores.');
  }

  if (match.status === 'completed' && previous.status !== 'completed') {
    if (!isNotificationEnabled('match_completed', settings, 'mobile')) return null;
    const score = `${match.home_score ?? '-'}–${match.away_score ?? '-'}`;
    return toastText('Match result official', `${label} ${score}`);
  }

  const homeJustSubmitted = Number(match.result_home_submitted)
    && !Number(previous.result_home_submitted)
    && !Number(match.result_away_submitted);
  if (side === 'away' && homeJustSubmitted) {
    if (!isNotificationEnabled('match_result_requested', settings, 'mobile')) return null;
    return toastText('Result submitted - your turn', `${label}. Upload your screenshot and confirm the score.`);
  }

  return null;
}

export function createToastDedupe(ttlMs = 4000) {
  const recent = new Map();
  return (message) => {
    const text = String(message || '').trim();
    if (!text) return false;
    const now = Date.now();
    for (const [key, expires] of recent) {
      if (expires <= now) recent.delete(key);
    }
    if (recent.has(text)) return false;
    recent.set(text, now + ttlMs);
    return true;
  };
}
