/**
 * Socket.io room protocol shared by SocketContext.
 * Server: JOINLEAVEROOM { action, channel } → emit 'update' { _channel, ...payload }.
 */

export function dispatchSocketUpdate(listeners, data) {
  const { _channel, ...payload } = data || {};
  if (!_channel) return 0;
  const callbacks = listeners.get(_channel);
  if (!callbacks) return 0;
  let n = 0;
  for (const callback of callbacks) {
    try {
      callback(payload);
      n += 1;
    } catch {
      /* ignore listener errors */
    }
  }
  return n;
}

export function joinChannel(socket, joinedChannels, channel) {
  if (!channel) return;
  joinedChannels.add(channel);
  if (socket?.connected) {
    socket.emit('JOINLEAVEROOM', { action: 'join', channel });
  }
}

export function leaveChannel(socket, joinedChannels, channel) {
  if (!channel) return;
  joinedChannels.delete(channel);
  if (socket?.connected) {
    socket.emit('JOINLEAVEROOM', { action: 'leave', channel });
  }
}

export function addChannelListener({ listeners, joinedChannels, socket, channel, callback }) {
  if (!channel || typeof callback !== 'function') return () => {};
  let callbacks = listeners.get(channel);
  const firstListener = !callbacks;
  if (!callbacks) {
    callbacks = new Set();
    listeners.set(channel, callbacks);
  }
  callbacks.add(callback);
  if (firstListener) joinChannel(socket, joinedChannels, channel);
  return () => removeChannelListener({ listeners, joinedChannels, socket, channel, callback });
}

export function removeChannelListener({ listeners, joinedChannels, socket, channel, callback = null }) {
  const callbacks = listeners.get(channel);
  if (callbacks && callback) {
    callbacks.delete(callback);
    if (callbacks.size > 0) return;
  }
  leaveChannel(socket, joinedChannels, channel);
  listeners.delete(channel);
}

export function rejoinChannels(socket, joinedChannels) {
  if (!socket?.connected) return;
  for (const channel of joinedChannels) {
    socket.emit('JOINLEAVEROOM', { action: 'join', channel });
  }
}

export function applyAuthToken(socket, token) {
  if (!socket) return false;
  socket.auth = { ...(socket.auth || {}), token: token || null };
  if (!token) {
    if (socket.connected) socket.disconnect();
    return false;
  }
  if (!socket.connected) socket.connect();
  return true;
}
