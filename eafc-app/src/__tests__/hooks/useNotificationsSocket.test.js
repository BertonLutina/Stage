import { renderHook, waitFor } from '@testing-library/react-native';
import useNotificationsSocket from '../../hooks/useNotificationsSocket';

const mockSubscribe = jest.fn(() => jest.fn());
const mockShowToast = jest.fn();
const mockResolveMyPlayerAndClub = jest.fn();

jest.mock('../../utils/toast', () => ({
  showToast: (...args) => mockShowToast(...args),
}));

jest.mock('../../api/stageClient', () => ({
  resolveMyPlayerAndClub: (...args) => mockResolveMyPlayerAndClub(...args),
  stageClient: {
    entities: {
      Notification: { subscribe: (...args) => mockSubscribe('Notification', ...args) },
      InboxMessage: { subscribe: (...args) => mockSubscribe('InboxMessage', ...args) },
      Match: { subscribe: (...args) => mockSubscribe('Match', ...args) },
    },
  },
}));

describe('useNotificationsSocket', () => {
  beforeEach(() => {
    mockSubscribe.mockClear();
    mockShowToast.mockClear();
    mockResolveMyPlayerAndClub.mockReset();
    mockResolveMyPlayerAndClub.mockResolvedValue({
      user: { id: 'u1', email: 'me@stage.test', player_id: 'p1' },
      player: { id: 'p1', email: 'me@stage.test', club_id: 'c1', notification_settings: {} },
      club: { id: 'c1', owner_email: 'owner@stage.test' },
    });
  });

  test('subscribes to notification, inbox, and match rooms after login', async () => {
    renderHook(() => useNotificationsSocket('u1'));
    await waitFor(() => expect(mockSubscribe).toHaveBeenCalledTimes(3));
    expect(mockSubscribe.mock.calls.map((call) => call[0])).toEqual([
      'Notification',
      'InboxMessage',
      'Match',
    ]);
  });

  test('still subscribes when player lookup fails', async () => {
    mockResolveMyPlayerAndClub.mockRejectedValueOnce(new Error('offline'));
    renderHook(() => useNotificationsSocket('u1'));
    await waitFor(() => expect(mockSubscribe).toHaveBeenCalledTimes(3));
  });
});
