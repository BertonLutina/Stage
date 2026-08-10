import { resolveMyPlayerAndClub, stageClient } from '@/api/stageClient';

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
    messages: messages || [],
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
  if (message.message_type === 'match_invite') {
    await stageClient.functions.invoke('respondInboxMessage', {
      message_id: message.id,
      action,
      new_date: newDate,
      new_time: newTime,
    });
    return action;
  }

  if (message.message_type === 'contract_offer' && (action === 'accepted' || action === 'declined')) {
    const meta = typeof message.metadata === 'object'
      ? message.metadata
      : (() => { try { return JSON.parse(message.metadata || '{}'); } catch { return {}; } })();
    const contractId = meta.contract_id || message.related_entity_id;
    if (contractId) {
      await stageClient.functions.invoke('contractManagement', {
        action: action === 'accepted' ? 'accept' : 'reject',
        contract_id: contractId,
      }).catch(async () => {
        await stageClient.entities.InboxMessage.update(message.id, { status: action, is_read: true });
      });
    }
    await stageClient.entities.InboxMessage.update(message.id, { status: action, is_read: true }).catch(() => {});
    return action;
  }

  await stageClient.entities.InboxMessage.update(message.id, { status: action, is_read: true });
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
