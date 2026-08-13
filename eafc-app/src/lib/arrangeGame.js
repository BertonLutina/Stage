import { resolveTimezone, timezoneLabel } from '@/lib/timezones';

export const ARRANGE_MIN_BET = 10_000;
export const ARRANGE_MAX_BET = 2_000_000;

function pad2(value) {
  return String(value).padStart(2, '0');
}

export function formatDateYmd(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return '';
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

export function formatTimeHm(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return '';
  return `${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
}

export function parseArrangeDateTime(dateStr, timeStr) {
  const fallback = new Date();
  fallback.setDate(fallback.getDate() + 1);
  fallback.setHours(21, 0, 0, 0);
  if (!dateStr) return fallback;
  const [year, month, day] = String(dateStr).split('-').map(Number);
  const [hours, minutes] = String(timeStr || '21:00').split(':').map(Number);
  const parsed = new Date(year, (month || 1) - 1, day || 1, hours || 0, minutes || 0, 0, 0);
  return Number.isNaN(parsed.getTime()) ? fallback : parsed;
}

export function formatArrangeDateLabel(dateStr) {
  if (!dateStr) return '';
  const date = parseArrangeDateTime(dateStr, '12:00');
  return date.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatKickoffLabel(dateStr, timeStr, timezone) {
  if (!dateStr || !timeStr) return '';
  return `${formatArrangeDateLabel(dateStr)} · ${timeStr} · ${timezoneLabel(timezone)}`;
}

export function combineDateTimeToMysql(dateStr, timeStr) {
  if (!dateStr || !timeStr) return null;
  const t = String(timeStr).trim();
  const timePart = t.length === 5 ? `${t}:00` : t.slice(0, 8);
  return `${dateStr} ${timePart}`;
}

export function isReachableEmail(email) {
  const value = String(email || '').trim();
  if (!value.includes('@')) return null;
  if (value.toLowerCase().endsWith('@stage.invalid')) return null;
  return value;
}

export function pickRecipientEmail(...candidates) {
  for (const raw of candidates) {
    const email = isReachableEmail(raw);
    if (email) return email;
  }
  return null;
}

export function validateArrangeWager(wagerStc, availableBalance = 0) {
  if (!wagerStc) return '';
  const wagerNumber = Number(wagerStc);
  if (wagerNumber < ARRANGE_MIN_BET) {
    return `Minimum bet is ${ARRANGE_MIN_BET.toLocaleString()} STC`;
  }
  if (wagerNumber > ARRANGE_MAX_BET) {
    return `Maximum bet is ${ARRANGE_MAX_BET.toLocaleString()} STC`;
  }
  if (wagerNumber > Number(availableBalance || 0)) {
    return `You only have ${Number(availableBalance || 0).toLocaleString()} STC available`;
  }
  return '';
}

export function formatOpponentLabel(opponent, kind) {
  if (kind === 'club') {
    const tag = opponent?.tag ? ` [${opponent.tag}]` : '';
    return `${opponent?.name || 'Club'}${tag}`;
  }
  return opponent?.gamertag || 'Player';
}

export async function sendArrangeGameInvite({
  stageClient,
  myPlayer,
  myClub,
  matchType,
  opponent,
  recipientKind,
  date,
  time,
  timezone,
  wagerStc = '',
}) {
  if (!opponent || !date || !time) throw new Error('Choose an opponent, date, and time');
  if (!recipientKind) throw new Error('Please choose an opponent again.');

  const scheduledDate = combineDateTimeToMysql(date, time);
  const kickoffTimezone = resolveTimezone(timezone);
  const senderIsClub = matchType === 'club' && Boolean(myClub);
  const recipientIsClub = recipientKind === 'club';
  const senderName = senderIsClub
    ? `${myClub?.name} [${myClub?.tag || ''}]`.replace(' []', '')
    : (myPlayer?.gamertag || 'Unknown');
  const senderClubId = senderIsClub ? (myClub?.id || null) : null;
  const opponentName = formatOpponentLabel(opponent, recipientKind);
  const invitationType = matchType === 'club' ? 'club_vs_club' : 'player_vs_player';

  let recipientEmail = null;
  let opponentPresidentId = null;
  let challengerPresidentId = myClub?.president_id || null;

  if (recipientIsClub) {
    try {
      const contact = await stageClient.functions.invoke('resolveClubContact', { club_id: opponent.id });
      recipientEmail = pickRecipientEmail(contact?.data?.recipient_email, contact?.recipient_email);
      opponentPresidentId = contact?.data?.president_id || opponentPresidentId;
    } catch {
      /* fall through */
    }
    if (!recipientEmail) {
      recipientEmail = pickRecipientEmail(opponent.president_email, opponent.owner_email);
    }
    if (!recipientEmail) {
      const clubPlayers = await stageClient.entities.Player.filter({ club_id: opponent.id }).catch(() => []);
      const president = clubPlayers.find((p) =>
        p.club_roles?.includes('president')
        || p.role === 'president'
        || p.club_roles?.includes('captain')
        || p.role === 'captain'
      ) || clubPlayers[0];
      recipientEmail = pickRecipientEmail(president?.email);
    }
  } else {
    recipientEmail = pickRecipientEmail(opponent.email);
    if (!recipientEmail) {
      try {
        const contact = await stageClient.functions.invoke('resolvePlayerContact', { player_id: opponent.id });
        recipientEmail = pickRecipientEmail(contact?.data?.recipient_email, contact?.recipient_email);
      } catch {
        /* fall through */
      }
    }
  }

  if (senderIsClub && !challengerPresidentId && myClub?.id) {
    const mine = await stageClient.entities.President.filter({ club_id: myClub.id }, null, 1).catch(() => []);
    challengerPresidentId = mine?.[0]?.id || null;
  }

  if (!recipientEmail) {
    throw new Error(
      recipientIsClub
        ? "Could not reach this club's president. They may not have a login email yet."
        : 'Could not reach this player. They may not have an account yet.',
    );
  }

  const available = senderIsClub ? Number(myClub?.stc || 0) : Number(myPlayer?.stc || 0);
  const wagerError = validateArrangeWager(wagerStc, available);
  if (wagerError) throw new Error(wagerError);

  const wagerAmount = wagerStc && Number(wagerStc) >= ARRANGE_MIN_BET && Number(wagerStc) <= ARRANGE_MAX_BET
    ? Number(wagerStc)
    : 0;
  const wagerLine = wagerAmount
    ? `\n\nSTC Wager: ${wagerAmount.toLocaleString()} STC each side (pot: ${(wagerAmount * 2).toLocaleString()} STC). Funds are locked from both balances when this invite is accepted.`
    : '';

  await stageClient.functions.invoke('sendInboxMessage', {
    recipient_email: recipientEmail,
    sender_email: senderIsClub
      ? (myClub?.owner_email || myPlayer?.email || 'system@stage.com')
      : (myPlayer?.email || 'system@stage.com'),
    sender_gamertag: senderName,
    sender_avatar_url: senderIsClub ? (myClub?.logo_url || '') : (myPlayer?.avatar_url || ''),
    sender_club_name: senderIsClub ? myClub?.name : null,
    subject: `Match Invitation: ${senderName} vs ${opponentName}`,
    body: `You have received a match invitation from ${senderName}.\n\nProposed date: ${date} at ${time} (${timezoneLabel(kickoffTimezone)})${wagerLine}\n\nPlease accept, decline, or request a different date.`,
    message_type: 'match_invite',
    action_type: 'accept_decline_date',
    related_entity_id: opponent.id,
    related_entity_type: recipientIsClub ? 'club' : 'player',
    status: 'pending',
    is_read: false,
    metadata: {
      invitation_type: invitationType,
      scheduled_date: scheduledDate,
      timezone: kickoffTimezone,
      challenger_name: senderName,
      opponent_name: opponentName,
      challenger_club_id: senderClubId,
      challenger_player_id: myPlayer?.id || null,
      challenger_president_id: senderIsClub ? challengerPresidentId : null,
      opponent_club_id: recipientIsClub ? opponent.id : null,
      opponent_player_id: !recipientIsClub ? opponent.id : null,
      opponent_president_id: recipientIsClub ? opponentPresidentId : null,
      wager_stc: wagerAmount,
    },
    send_notification: true,
  });

  return { invitationType, scheduledDate, opponentName, timezone: kickoffTimezone };
}
