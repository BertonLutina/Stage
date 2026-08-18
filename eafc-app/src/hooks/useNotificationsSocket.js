import { useEffect, useRef } from 'react';
import { showToast } from '../utils/toast';
import { stageClient, resolveMyPlayerAndClub } from '../api/stageClient';
import { isNotificationEnabled, parseNotificationSettings } from '../lib/notificationTypes';

/**
 * Surface new Notification / Inbox toasts from the shared STAGE socket.
 * Entity.subscribe() joins STAGE_NOTIFICATION_* / STAGE_INBOX_* rooms.
 * Toasts follow the Mobile notification channel in Settings.
 */
export default function useNotificationsSocket(userId) {
  const settingsRef = useRef({});

  useEffect(() => {
    if (!userId) return undefined;
    let cancelled = false;
    resolveMyPlayerAndClub()
      .then(({ player }) => {
        if (cancelled) return;
        settingsRef.current = parseNotificationSettings(player?.notification_settings);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [userId]);

  useEffect(() => {
    if (!userId) return undefined;

    const unsubNotif = stageClient.entities.Notification.subscribe((event) => {
      if (!event.data) return;
      if (event.type !== 'create' && event.type !== 'update') return;
      if (event.data.read === true || event.data.read === 1) return;
      if (!isNotificationEnabled(event.data.type, settingsRef.current, 'mobile')) return;
      const title = event.data.title || 'New notification';
      showToast(title);
    });

    const unsubInbox = stageClient.entities.InboxMessage.subscribe((event) => {
      if (event?.type !== 'create' || !event.data) return;
      if (!isNotificationEnabled(event.data.message_type || event.data.type || 'message', settingsRef.current, 'mobile')) return;
      const subject = event.data.subject || 'New inbox message';
      showToast(subject);
    });

    return () => {
      if (typeof unsubNotif === 'function') unsubNotif();
      if (typeof unsubInbox === 'function') unsubInbox();
    };
  }, [userId]);
}
