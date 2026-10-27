/**
 * Game Day → Inbox bridge.
 * Actionable match events become distinct inbox mails (never reuse a prior match mail).
 */
import { stageClient } from '@/api/stageClient';
import { getClubManagerEmail } from '@/lib/scheduleEngine';

function matchLabel(game = {}) {
  const home = game.home_club_name || game.home_player_name || 'Home';
  const away = game.away_club_name || game.away_player_name || 'Away';
  return `${home} vs ${away}`;
}

function scoreLine(payload = {}, game = {}) {
  const home = payload.home_score ?? game.home_score ?? '?';
  const away = payload.away_score ?? game.away_score ?? '?';
  return `${home}–${away}`;
}

async function resolveOpponentEmail(game, isHomeTeam) {
  if (!game) return null;
  if (isHomeTeam) {
    if (game.away_club_id) return getClubManagerEmail(game.away_club_id);
    return game.away_player_email || game.away_owner_email || null;
  }
  if (game.home_club_id) return getClubManagerEmail(game.home_club_id);
  return game.home_player_email || game.home_owner_email || null;
}

const COPY = {
  submit_result: {
    subject: (label, score) => `Confirm result: ${label} (${score})`,
    body: (sender, label, score) => `${sender} submitted ${score} for ${label}.\n\nOpen Game Day to confirm, correct, or dispute. Enter your own club stats when you confirm.`,
  },
  propose_correction: {
    subject: (label, score) => `Correction proposed: ${label} (${score})`,
    body: (sender, label, score) => `${sender} proposed a correction (${score}) for ${label}.\n\nOpen Game Day to accept, counter once, or dispute.`,
  },
  counter_result: {
    subject: (label, score) => `Counter result: ${label} (${score})`,
    body: (sender, label, score) => `${sender} countered with ${score} for ${label}.\n\nOpen Game Day to review.`,
  },
  dispute_result: {
    subject: (label) => `Result disputed: ${label}`,
    body: (sender, label) => `${sender} opened a dispute on ${label}. Admin review is in progress.`,
  },
  confirm_result: {
    subject: (label, score) => `Result confirmed: ${label} (${score})`,
    body: (sender, label, score) => `${sender} confirmed ${score} for ${label}.`,
  },
  accept_correction: {
    subject: (label, score) => `Correction accepted: ${label} (${score})`,
    body: (sender, label, score) => `${sender} accepted the corrected score ${score} for ${label}.`,
  },
};

/**
 * After a result negotiation step, notify the other side with a fresh inbox mail.
 * Best-effort: never blocks the Game Day submit if mail fails.
 */
export async function notifyGameDayInbox({
  game,
  action,
  payload,
  myClub,
  myPlayer,
  isHomeTeam,
  myEmail,
} = {}) {
  try {
    if (!COPY[action] || !game?.id) return null;

    const recipientEmail = await resolveOpponentEmail(game, Boolean(isHomeTeam));
    if (!recipientEmail) return null;

    const label = matchLabel(game);
    const score = scoreLine(payload, game);
    const senderName = myClub?.name || myPlayer?.gamertag || 'Opponent';
    const senderEmail = myEmail || myPlayer?.email || myClub?.owner_email || 'system@stage.com';
    const copy = COPY[action];

    const eventKey = `gameday_${game.id}_${action}_${Date.now()}`;

    return await stageClient.functions.invoke('sendInboxMessage', {
      recipient_email: String(recipientEmail).trim().toLowerCase(),
      sender_email: senderEmail,
      sender_gamertag: senderName,
      sender_club_name: myClub?.name || null,
      sender_avatar_url: myClub?.logo_url || myPlayer?.avatar_url || null,
      subject: copy.subject(label, score),
      body: copy.body(senderName, label, score),
      message_type: 'gameday_result',
      action_type: 'open_match',
      related_entity_id: `${game.id}_${action}_${Date.now()}`,
      related_entity_type: 'match',
      status: 'pending',
      is_read: false,
      force_new: true,
      metadata: {
        event_key: eventKey,
        match_id: game.id,
        action,
        score,
        home_score: payload?.home_score,
        away_score: payload?.away_score,
        link: `/game-day?matchId=${encodeURIComponent(String(game.id))}`,
      },
      send_notification: true,
    });
  } catch {
    return null;
  }
}
