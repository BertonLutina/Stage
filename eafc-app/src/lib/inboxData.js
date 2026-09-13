import { resolveMyPlayerAndClub, stageClient } from '@/api/stageClient';
import { parseInboxMetadata, sortInboxByActivity } from '@/lib/inboxHelpers';
import { acceptProposal, declineProposal, loadFixtureForInbox, proposeTime, roleForClub } from '@/lib/scheduleEngine';

export async function loadInboxMessages() {
  const { user, player, club } = await resolveMyPlayerAndClub();
  if (!user?.email) {
    return { user: null, player: null, club: null, email: null, messages: [] };
  }
  const email = String(user.email).trim().toLowerCase();
  const messages = await stageClient.entities.InboxMessage
    .filter({ recipient_email: email }, '-created_date', 200)
    .catch(() => []);
  return {
    user,
    player,
    club,
    email,
    messages: sortInboxByActivity(messages || []),
  };
}

export async function markInboxMessageRead(message) {
  if (!message?.id || message.is_read) return message;
  await stageClient.entities.InboxMessage.update(message.id, { is_read: true });
  return { ...message, is_read: true };
}

export async function markAllInboxRead(messages = []) {
  const unread = messages.filter((m) => !m.is_read);
  await Promise.all(unread.map((m) => stageClient.entities.InboxMessage.update(m.id, { is_read: true })));
  return messages.map((m) => ({ ...m, is_read: true }));
}

export async function deleteInboxMessage(id) {
  await stageClient.entities.InboxMessage.delete(id);
}

export async function respondToInboxMessage(message, action, { newDate = null, newTime = null } = {}) {
  // Temporary league_schedule exception until Stage folds it into respondInboxMessage.
  if (message.message_type === 'league_schedule') {
    const meta = parseInboxMetadata(message);
    const { user, club, player } = await resolveMyPlayerAndClub();
    const { fixture, fixtureType } = await loadFixtureForInbox(meta);
    const role = roleForClub(fixture, club?.id) || (meta.proposed_by_role === 'home' ? 'away' : 'home');

    if (action === 'accepted' || action === 'confirmed') {
      if (!fixture) throw new Error('Fixture not found for this schedule invite');
      await acceptProposal({
        fixture,
        fixtureType,
        role,
        myClub: club,
        myEmail: user?.email,
      });
      return 'accepted';
    }

    if (action === 'declined') {
      if (!fixture) throw new Error('Fixture not found for this schedule invite');
      await declineProposal({
        fixture,
        fixtureType,
        role,
        myClub: club,
        myEmail: user?.email,
        myGamertag: player?.gamertag,
      });
      return 'declined';
    }

    if (action === 'date_change_requested' || action === 'propose') {
      if (!fixture) throw new Error('Fixture not found');
      const proposedDate = newDate && newTime ? `${newDate} ${newTime}` : (newDate || meta.proposed_date);
      await proposeTime({
        fixture,
        fixtureType,
        role,
        proposedDate,
        myClub: club,
        myEmail: user?.email,
        myGamertag: player?.gamertag,
      });
      return 'date_change_requested';
    }
  }

  await stageClient.functions.invoke('respondInboxMessage', {
    message_id: message.id,
    action,
    new_date: newDate,
    new_time: newTime,
  });
  return action;
}

export async function loadNotifications() {
  const { user } = await resolveMyPlayerAndClub();
  if (!user?.email) return { user: null, email: null, notifications: [] };
  const email = String(user.email).trim().toLowerCase();
  const notifications = await stageClient.entities.Notification
    .filter({ recipient_email: email }, '-created_date', 100)
    .catch(() => []);
  return { user, email, notifications: notifications || [] };
}

export async function markNotificationRead(notif) {
  if (!notif?.id) return notif;
  const updated = await stageClient.http.post(`/notifications/${notif.id}/read`, {}).catch(() => null);
  if (updated?.id) return { ...notif, ...updated, read: 1, is_read: true };
  await stageClient.entities.Notification.update(notif.id, { read: true }).catch(() => {});
  return { ...notif, read: 1, is_read: true };
}

export async function markAllNotificationsRead(notifications = []) {
  await Promise.all((notifications || []).map((row) => markNotificationRead(row)));
  return notifications.map((row) => ({ ...row, read: 1, is_read: true }));
}

export async function deleteNotification(id) {
  if (!id) return;
  await stageClient.entities.Notification.delete(id);
}

export async function deleteAllNotifications(notifications = []) {
  await Promise.all((notifications || []).map((row) => deleteNotification(row.id)));
}
