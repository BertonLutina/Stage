import {
  addChannelListener,
  applyAuthToken,
  dispatchSocketUpdate,
  rejoinChannels,
} from '../../lib/socketRealtime';

function fakeSocket({ connected = false } = {}) {
  return {
    connected,
    auth: {},
    emit: jest.fn(),
    connect: jest.fn(function connect() {
      this.connected = true;
    }),
    disconnect: jest.fn(function disconnect() {
      this.connected = false;
    }),
  };
}

describe('mobile socket realtime protocol', () => {
  test('joins the socket room when the first listener is added on a live socket', () => {
    const socket = fakeSocket({ connected: true });
    const listeners = new Map();
    const joinedChannels = new Set();
    const callback = jest.fn();

    addChannelListener({
      listeners,
      joinedChannels,
      socket,
      channel: 'STAGE_MATCH',
      callback,
    });

    expect(socket.emit).toHaveBeenCalledWith('JOINLEAVEROOM', {
      action: 'join',
      channel: 'STAGE_MATCH',
    });
    expect(joinedChannels.has('STAGE_MATCH')).toBe(true);
  });

  test('remembers the room and joins later when the socket connects', () => {
    const socket = fakeSocket({ connected: false });
    const listeners = new Map();
    const joinedChannels = new Set();

    addChannelListener({
      listeners,
      joinedChannels,
      socket,
      channel: 'STAGE_INBOX_a@b.com',
      callback: jest.fn(),
    });

    expect(socket.emit).not.toHaveBeenCalled();

    socket.connected = true;
    rejoinChannels(socket, joinedChannels);

    expect(socket.emit).toHaveBeenCalledWith('JOINLEAVEROOM', {
      action: 'join',
      channel: 'STAGE_INBOX_a@b.com',
    });
  });

  test('delivers server update payloads to the matching channel callback', () => {
    const socket = fakeSocket({ connected: true });
    const listeners = new Map();
    const joinedChannels = new Set();
    const callback = jest.fn();

    addChannelListener({
      listeners,
      joinedChannels,
      socket,
      channel: 'STAGE_MATCH_m1',
      callback,
    });

    dispatchSocketUpdate(listeners, {
      _channel: 'STAGE_MATCH_m1',
      id: 'm1',
      status: 'in_progress',
    });

    expect(callback).toHaveBeenCalledWith({ id: 'm1', status: 'in_progress' });
  });

  test('ignores updates that have no channel', () => {
    const callback = jest.fn();
    const listeners = new Map([['STAGE_MATCH', new Set([callback])]]);
    dispatchSocketUpdate(listeners, { id: 'm1' });
    expect(callback).not.toHaveBeenCalled();
  });

  test('leaves the room when the last listener is removed', () => {
    const socket = fakeSocket({ connected: true });
    const listeners = new Map();
    const joinedChannels = new Set();
    const callback = jest.fn();

    const unsub = addChannelListener({
      listeners,
      joinedChannels,
      socket,
      channel: 'STAGE_MATCH',
      callback,
    });
    unsub();

    expect(socket.emit).toHaveBeenCalledWith('JOINLEAVEROOM', {
      action: 'leave',
      channel: 'STAGE_MATCH',
    });
    expect(joinedChannels.has('STAGE_MATCH')).toBe(false);
  });

  test('connects with a token and disconnects when the token is cleared', () => {
    const socket = fakeSocket({ connected: false });

    expect(applyAuthToken(socket, 'jwt-token')).toBe(true);
    expect(socket.auth.token).toBe('jwt-token');
    expect(socket.connect).toHaveBeenCalled();

    socket.connected = true;
    expect(applyAuthToken(socket, null)).toBe(false);
    expect(socket.disconnect).toHaveBeenCalled();
  });
});
