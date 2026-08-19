import { useEffect } from 'react';
import { showToast } from '../utils/toast';
import { stageClient, resolveMyPlayerAndClub } from '../api/stageClient';
import { parseNotificationSettings } from '../lib/notificationTypes';
import {
  createToastDedupe,
  notificationEmailsForUser,
  toastFromInbox,
  toastFromMatchUpdate,
  toastFromNotification,
} from '../lib/matchNotificationToasts';

/**
 * Surface new Notification / Inbox / Match toasts from the shared STAGE socket.
 * Entity.subscribe() joins STAGE_NOTIFICATION_* / STAGE_INBOX_* / STAGE_MATCH rooms.
 * Toasts follow the Mobile notification channel in Settings.
 */
export default function useNotificationsSocket(userId) {
  useEffect(() => {
    if (!userId) return undefined;
    let cancelled = false;
    const unsubs = [];
    const allowToast = createToastDedupe();
    const matchSnapshots = new Map();

    const toast = (message) => {
      if (allowToast(message)) showToast(message);
    };

    resolveMyPlayerAndClub()
      .then(({ user, player, club }) => {
        if (cancelled) return;
        const settings = parseNotificationSettings(player?.notification_settings);
        const emails = notificationEmailsForUser({ user, player, club });
        const identity = {
          playerId: player?.id || user?.player_id || null,
          clubId: club?.id || player?.club_id || null,
          emails,
        };

        unsubs.push(stageClient.entities.Notification.subscribe((event) => {
          toast(toastFromNotification(event, settings));
        }, { emails }));

        unsubs.push(stageClient.entities.InboxMessage.subscribe((event) => {
          toast(toastFromInbox(event, settings));
        }, { emails }));

        unsubs.push(stageClient.entities.Match.subscribe((event) => {
          const match = event?.data;
          if (!match?.id || event?.type === 'delete') return;
          const previous = matchSnapshots.get(String(match.id)) || null;
          matchSnapshots.set(String(match.id), match);
          toast(toastFromMatchUpdate(match, previous, identity, settings));
        }));
      })
      .catch(() => {});

    return () => {
      cancelled = true;
      unsubs.forEach((unsub) => {
        if (typeof unsub === 'function') unsub();
      });
    };
  }, [userId]);
}
