/**
 * React Native–safe socket channel helpers for stageClient entity.subscribe().
 * Full SocketProvider UI wiring can be added later; this keeps CRUD + realtime hooks non-fatal.
 */

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

const _listeners = new Map();

export const setSocketListeners = (channel, callback) => {
  if (!channel || typeof callback !== 'function') return;
  if (!_listeners.has(channel)) _listeners.set(channel, new Set());
  _listeners.get(channel).add(callback);
};

export const offSocketListeners = (channel, callback = null) => {
  if (!channel || !_listeners.has(channel)) return;
  if (!callback) {
    _listeners.delete(channel);
    return;
  }
  _listeners.get(channel).delete(callback);
  if (_listeners.get(channel).size === 0) _listeners.delete(channel);
};

/** Optional: emit to local subscribers (useful once a real socket is wired). */
export function emitLocalChannel(channel, payload) {
  const set = _listeners.get(channel);
  if (!set) return;
  for (const cb of set) {
    try { cb(payload); } catch { /* ignore */ }
  }
}
