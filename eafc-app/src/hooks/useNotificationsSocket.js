import { useEffect } from 'react';
import { showToast } from '../utils/toast';
import { stageClient } from '../api/stageClient';

/**
 * Surface new Notification / Inbox toasts from the shared STAGE socket.
 * Entity.subscribe() joins STAGE_NOTIFICATION_* / STAGE_INBOX_* rooms.
 */
export default function useNotificationsSocket(userId) {
  useEffect(() => {
    if (!userId) return undefined;

    const unsubNotif = stageClient.entities.Notification.subscribe((event) => {
      if (event?.type !== 'create' || !event.data) return;
      const title = event.data.title || 'New notification';
      showToast(title);
    });

    const unsubInbox = stageClient.entities.InboxMessage.subscribe((event) => {
      if (event?.type !== 'create' || !event.data) return;
      const subject = event.data.subject || 'New inbox message';
      showToast(subject);
    });

    return () => {
      if (typeof unsubNotif === 'function') unsubNotif();
      if (typeof unsubInbox === 'function') unsubInbox();
    };
  }, [userId]);
}
