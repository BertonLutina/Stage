import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { SOCKET_URL } from '../utils/api';
import { showToast } from '../utils/toast';

export default function useNotificationsSocket(userId) {
  const socketRef = useRef(null);

  useEffect(() => {
    if (!userId) return;
    const socket = io(`${SOCKET_URL}/notifications`);
    socketRef.current = socket;
    socket.emit('subscribe', userId);
    socket.on('join_accepted', (data) => {
      const gamerTag = data.gamerTag || 'Player';
      showToast(`Hi ${gamerTag}, you have successfully joined the team!`);
    });
    return () => socket.disconnect();
  }, [userId]);
}
