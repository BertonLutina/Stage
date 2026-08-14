/**
 * Socket.io client for stageClient entity.subscribe().
 * Joins STAGE_* rooms and delivers server `update` packets to local listeners.
 */
import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { hydrateStageStorage, localStorage } from '@/lib/polyfillStorage';
import { SOCKET_URL } from '../utils/api';
import {
  addChannelListener,
  applyAuthToken,
  dispatchSocketUpdate,
  rejoinChannels,
  removeChannelListener,
} from './socketRealtime';

export const CHANNELS = {
  PLAYER: 'STAGE_PLAYER',
  CLUB: 'STAGE_CLUB',
  MATCH: 'STAGE_MATCH',
  POST: 'STAGE_POST',
  NOTIFICATION: 'STAGE_NOTIFICATION',
  INBOX: 'STAGE_INBOX',
  DRESSING_ROOM: 'STAGE_DRESSING_ROOM',
  CHAT_MESSAGE: 'STAGE_CHAT_MESSAGE',
  TOURNAMENT: 'STAGE_TOURNAMENT',
  POST_FEED: 'STAGE_POST_FEED',
  TRANSFER_WINDOW: 'STAGE_TRANSFER_WINDOW',
};

export const makeChannel = (id, channel) =>
  id ? `${channel}_${String(id)}` : channel;

const ACCESS_KEY = 'stage_access_token';
const AUTH_CHANGED_EVENT = 'stage-auth-changed';

export const SOCKET_CLIENT = io(SOCKET_URL, {
  transports: ['websocket', 'polling'],
  rememberUpgrade: true,
  upgrade: true,
  auth: { token: null },
  reconnection: true,
  reconnectionAttempts: 8,
  reconnectionDelay: 2000,
  autoConnect: false,
});

const _listeners = new Map();
const _joinedChannels = new Set();

let socketConnectErrorLogged = false;
SOCKET_CLIENT.on('connect_error', () => {
  if (!socketConnectErrorLogged) {
    socketConnectErrorLogged = true;
    console.info('[socket] Realtime unavailable — app continues without live updates.');
  }
});

SOCKET_CLIENT.on('update', (data) => {
  dispatchSocketUpdate(_listeners, data);
});

SOCKET_CLIENT.on('connect', () => {
  rejoinChannels(SOCKET_CLIENT, _joinedChannels);
});

async function readSocketToken() {
  try {
    const fromStorage = localStorage.getItem(ACCESS_KEY);
    if (fromStorage) return fromStorage;
  } catch {
    /* ignore */
  }
  try {
    const { getAccessToken } = await import('../services/tokenService');
    return await getAccessToken();
  } catch {
    return null;
  }
}

export async function connectWithStoredToken() {
  const token = await readSocketToken();
  return applyAuthToken(SOCKET_CLIENT, token);
}

export const setSocketListeners = (channel, callback) =>
  addChannelListener({
    listeners: _listeners,
    joinedChannels: _joinedChannels,
    socket: SOCKET_CLIENT,
    channel,
    callback,
  });

export const offSocketListeners = (channel, callback = null) => {
  removeChannelListener({
    listeners: _listeners,
    joinedChannels: _joinedChannels,
    socket: SOCKET_CLIENT,
    channel,
    callback,
  });
};

export function emitLocalChannel(channel, payload) {
  dispatchSocketUpdate(_listeners, { _channel: channel, ...(payload || {}) });
}

const SocketStatusContext = createContext({ isConnected: false });

export const SocketProvider = ({ children, userId }) => {
  const [isConnected, setIsConnected] = useState(Boolean(SOCKET_CLIENT.connected));

  useEffect(() => {
    const onConnect = () => setIsConnected(true);
    const onDisconnect = () => setIsConnected(false);
    SOCKET_CLIENT.on('connect', onConnect);
    SOCKET_CLIENT.on('disconnect', onDisconnect);

    let cancelled = false;
    (async () => {
      try {
        await hydrateStageStorage();
      } catch {
        /* ignore */
      }
      if (!cancelled) await connectWithStoredToken();
    })();

    const onAuthChanged = () => {
      connectWithStoredToken();
    };
    if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
      window.addEventListener(AUTH_CHANGED_EVENT, onAuthChanged);
    }

    return () => {
      cancelled = true;
      SOCKET_CLIENT.off('connect', onConnect);
      SOCKET_CLIENT.off('disconnect', onDisconnect);
      if (typeof window !== 'undefined' && typeof window.removeEventListener === 'function') {
        window.removeEventListener(AUTH_CHANGED_EVENT, onAuthChanged);
      }
    };
  }, [userId]);

  return (
    <SocketStatusContext.Provider value={{ isConnected }}>
      {children}
    </SocketStatusContext.Provider>
  );
};

export const useSocket = () => useContext(SocketStatusContext);
