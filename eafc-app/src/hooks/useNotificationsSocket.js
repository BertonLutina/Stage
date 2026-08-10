import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { SOCKET_URL } from '../utils/api';
import { getAccessToken } from '../services/tokenService';
import { showToast } from '../utils/toast';
import { stageClient } from '../api/stageClient';

/**
 * Keep notification socket alive and surface new Notification / Inbox toasts.
 */
export default function useNotificationsSocket(userId) {
  const socketRef = useRef(null);

  useEffect(() => {
    if (!userId) return undefined;
    let cancelled = false;
    let socket;

    (async () => {
      const token = await getAccessToken();
      if (cancelled) return;
      socket = io(`${SOCKET_URL}/notifications`, {
        auth: { token },
        transports: ['websocket', 'polling'],
      });
      socketRef.current = socket;
      socket.emit('subscribe', userId);
      socket.on('join_accepted', (data) => {
        const gamerTag = data.gamerTag || data.gamer_tag || 'Player';
        showToast(`Hi ${gamerTag}, you have successfully joined the team!`);
      });
    })();

    return () => {
      cancelled = true;
      socket?.disconnect();
    };
  }, [userId]);

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
