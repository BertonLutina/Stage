import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';

const mockPush = jest.fn();
const mockBack = jest.fn();
const mockRefetch = jest.fn(() => Promise.resolve());
let mockResource;

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, back: mockBack }),
}));
jest.mock('expo-linear-gradient', () => {
  const ReactModule = require('react');
  const { View } = require('react-native');
  return { LinearGradient: ({ children, style }) => ReactModule.createElement(View, { style }, children) };
});
jest.mock('expo-blur', () => {
  const ReactModule = require('react');
  const { View } = require('react-native');
  return { BlurView: ({ children, style }) => ReactModule.createElement(View, { style }, children) };
});
jest.mock('../../api/stageClient', () => ({
  resolveMyPlayerAndClub: jest.fn(() => Promise.resolve({})),
  stageClient: {},
}));
jest.mock('../../hooks/useNotificationsFeed', () => ({ __esModule: true, default: () => mockResource }));

const mockMarkRead = jest.fn();
jest.mock('../../lib/inboxData', () => ({
  loadNotifications: jest.fn(),
  markNotificationRead: (...a) => mockMarkRead(...a),
}));

import NotificationsScreen from '../../app/apps/notifications';
import { prepareNotifications } from '../../lib/notificationsFeed';

const iso = (hoursAgo) => new Date(Date.now() - hoursAgo * 3600000).toISOString();
const rows = () => prepareNotifications([
  { id: 'a', type: 'result_submitted', title: 'Score to confirm', body: 'Red Foxes reported 2 – 1.', read: 0, link: '/matches/m1', created_date: iso(0.1) },
  { id: 'b', type: 'contract_offer', title: 'New contract offer', body: 'Blue Comets offer you 20 games.', read: 0, link: '/inbox/c1', created_date: iso(0.2) },
  { id: 'c', type: 'match_result', title: 'Lineup published', body: 'You start.', read: 1, created_date: iso(0.3) },
  { id: 'd', type: 'announcement', title: 'Old news', body: 'Long ago.', read: 1, created_date: iso(24 * 20) },
]);

function resource(data, over = {}) {
  return { data, loading: false, error: null, refreshing: false, refetch: mockRefetch, ...over };
}

describe('Notifications screen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockMarkRead.mockImplementation((n) => Promise.resolve({ ...n, read: 1 }));
    mockResource = resource(rows());
  });

  test('loading skeleton, error with Retry', () => {
    mockResource = resource(undefined, { loading: true });
    const loading = render(<NotificationsScreen />);
    expect(loading.getByTestId('skeleton-list')).toBeTruthy();
    loading.unmount();
    mockResource = resource(undefined, { error: 'Feed down' });
    const failed = render(<NotificationsScreen />);
    expect(failed.getByText('Feed down')).toBeTruthy();
    fireEvent.press(failed.getByText('Retry'));
    expect(mockRefetch).toHaveBeenCalled();
  });

  test('groups by period and shows the server text', () => {
    const { getByText } = render(<NotificationsScreen />);
    expect(getByText('Today')).toBeTruthy();
    expect(getByText('Earlier')).toBeTruthy();
    expect(getByText('Score to confirm')).toBeTruthy();
    expect(getByText('Red Foxes reported 2 – 1.')).toBeTruthy();
    expect(getByText('Old news')).toBeTruthy();
  });

  test('unread rows are marked, read rows are not', () => {
    const { getAllByLabelText } = render(<NotificationsScreen />);
    expect(getAllByLabelText('Unread')).toHaveLength(2);
  });

  test('tapping an unread notification marks it read, then opens its link', async () => {
    const { getByText, getAllByLabelText } = render(<NotificationsScreen />);
    fireEvent.press(getByText('Score to confirm'));
    await waitFor(() => expect(mockMarkRead).toHaveBeenCalledWith(expect.objectContaining({ id: 'a' })));
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith({
      pathname: '/(tabs)/matches/matchdetailscreen', params: { matchId: 'm1' },
    }));
    expect(getAllByLabelText('Unread')).toHaveLength(1);
  });

  test('an already read notification is opened without another read call', async () => {
    mockResource = resource(prepareNotifications([
      { id: 'r', type: 'match_result', title: 'Done', body: '', read: 1, link: '/matches/m9', created_date: iso(0.1) },
    ]));
    const { getByText } = render(<NotificationsScreen />);
    fireEvent.press(getByText('Done'));
    await waitFor(() => expect(mockPush).toHaveBeenCalled());
    expect(mockMarkRead).not.toHaveBeenCalled();
  });

  test('a notification without a usable link is only marked read', async () => {
    mockResource = resource(prepareNotifications([
      { id: 'n', type: 'announcement', title: 'No link', body: '', read: 0, link: null, created_date: iso(0.1) },
    ]));
    const { getByText, queryByLabelText } = render(<NotificationsScreen />);
    fireEvent.press(getByText('No link'));
    await waitFor(() => expect(mockMarkRead).toHaveBeenCalled());
    await waitFor(() => expect(queryByLabelText('Unread')).toBeNull());
    expect(mockPush).not.toHaveBeenCalled();
  });

  test('Mark all read marks every unread one, then reloads from the server', async () => {
    const { getByLabelText } = render(<NotificationsScreen />);
    await act(async () => { fireEvent.press(getByLabelText('Mark all read')); });
    await waitFor(() => expect(mockMarkRead).toHaveBeenCalledTimes(2));
    expect(mockMarkRead.mock.calls.map(([n]) => n.id).sort()).toEqual(['a', 'b']);
    await waitFor(() => expect(mockRefetch).toHaveBeenCalled());
  });

  test('Mark all read is inert when everything is read', () => {
    mockResource = resource(rows().map((n) => ({ ...n, unread: false })));
    const { getByLabelText } = render(<NotificationsScreen />);
    fireEvent.press(getByLabelText('Mark all read'));
    expect(mockMarkRead).not.toHaveBeenCalled();
  });

  test('empty state', () => {
    mockResource = resource([]);
    const { getByText } = render(<NotificationsScreen />);
    expect(getByText('No notifications yet')).toBeTruthy();
  });

  test('the settings button opens notification settings, Back leaves', () => {
    const { getByLabelText } = render(<NotificationsScreen />);
    fireEvent.press(getByLabelText('Notification settings'));
    expect(mockPush).toHaveBeenCalledWith('/apps/notification-settings');
    fireEvent.press(getByLabelText('Back'));
    expect(mockBack).toHaveBeenCalled();
  });
});
