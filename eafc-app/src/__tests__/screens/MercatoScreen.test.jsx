import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

const mockPush = jest.fn();
const mockBack = jest.fn();
const mockDeskRefetch = jest.fn();
const mockOffersRefetch = jest.fn();
let mockWindow = null;
let mockDesk;
let mockOffers;

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
  stageClient: { http: { get: jest.fn(() => Promise.resolve({})) } },
}));
jest.mock('../../hooks/useTransferWindowStatus', () => ({
  useTransferWindowStatus: () => ({ currentWindow: mockWindow, loading: false }),
}));
jest.mock('../../hooks/useMercato', () => ({
  useMercatoDesk: () => mockDesk,
  useMyOffers: () => mockOffers,
}));
jest.mock('../../components/mercato/FreeAgentsView', () => {
  const ReactModule = require('react');
  const { Text } = require('react-native');
  return { __esModule: true, default: () => ReactModule.createElement(Text, null, 'free-agents-view') };
});

import MercatoScreen from '../../app/apps/transfers';

const feedItem = (over = {}) => ({
  id: 't1', playerId: 'p1', name: 'Kaze', initials: 'KA', avatarUrl: null, position: 'CAM',
  from: 'Storm United', fromIsFree: false, to: 'Night Owls FC',
  status: 'signed', statusLabel: 'SIGNED', tone: 'success', fee: 1500, currency: 'STC', dealType: 'Permanent',
  ...over,
});
const offer = (over = {}) => ({
  id: 'k1', direction: 'received', status: 'pending', live: true, counterpart: 'Storm United',
  playerId: 'p1', typeLabel: 'Squad', weeklyWage: 40, ...over,
});
const resource = (data, over = {}) => ({
  data, loading: false, error: null, refreshing: false, refetch: jest.fn(), ...over,
});

describe('Mercato screen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockWindow = { id: 'w1', status: 'open', end_date: '2099-11-23T23:59:00Z' };
    mockDesk = resource({ window: null, feed: [feedItem(), feedItem({ id: 't2', playerId: 'p2', name: 'Tikka', from: null, fromIsFree: true, fee: null, status: 'negotiation', statusLabel: 'IN NEGOTIATION', tone: 'warning' })] });
    mockOffers = resource([offer(), offer({ id: 'k2', direction: 'sent', status: 'negotiating', counterpart: 'Vix', playerId: 'p7' }), offer({ id: 'k3', status: 'rejected', live: false })]);
  });

  test('open window banner with the real closing date, and three tabs with the live offer count', () => {
    const { getByText, getByTestId } = render(<MercatoScreen />);
    expect(getByText('Transfer window open')).toBeTruthy();
    expect(getByText(/^Closes /)).toBeTruthy();
    expect(getByTestId('mercato-window')).toBeTruthy();
    expect(getByText('Feed')).toBeTruthy();
    expect(getByText('Free agents')).toBeTruthy();
    expect(getByText('My offers · 2')).toBeTruthy();
  });

  test('closed and missing windows', () => {
    mockWindow = { id: 'w1', status: 'closed', end_date: '2020-01-01T00:00:00Z' };
    const closed = render(<MercatoScreen />);
    expect(closed.getByText('Transfer window closed')).toBeTruthy();
    closed.unmount();
    mockWindow = null;
    const none = render(<MercatoScreen />);
    expect(none.getByText('No transfer window scheduled yet')).toBeTruthy();
  });

  test('feed lists the desk deals with status, route and fee; free agent has no origin club', () => {
    const { getByText, getByLabelText } = render(<MercatoScreen />);
    expect(getByText('Kaze')).toBeTruthy();
    expect(getByText('SIGNED')).toBeTruthy();
    expect(getByText('1 500 STC')).toBeTruthy();
    expect(getByText('IN NEGOTIATION')).toBeTruthy();
    expect(getByText(/^Free agent\s+→\s+Night Owls FC/)).toBeTruthy();
    fireEvent.press(getByLabelText('Kaze, SIGNED'));
    expect(mockPush).toHaveBeenCalledWith({ pathname: '/(tabs)/profile/profilescreen', params: { playerId: 'p1' } });
  });

  test('offers waiting banner opens the inbox', () => {
    const { getByLabelText } = render(<MercatoScreen />);
    fireEvent.press(getByLabelText('You have 1 contract offer waiting'));
    expect(mockPush).toHaveBeenCalledWith('/apps/inbox');
  });

  test('feed loading, error with Retry, and empty states', () => {
    mockDesk = resource(undefined, { loading: true });
    const loading = render(<MercatoScreen />);
    expect(loading.getByTestId('skeleton-list')).toBeTruthy();
    loading.unmount();

    mockDesk = resource(undefined, { error: 'Desk down' });
    const failed = render(<MercatoScreen />);
    expect(failed.getByText('Desk down')).toBeTruthy();
    fireEvent.press(failed.getByText('Retry'));
    expect(mockDesk.refetch).toHaveBeenCalled();
    failed.unmount();

    mockDesk = resource({ window: null, feed: [] });
    const empty = render(<MercatoScreen />);
    expect(empty.getByText('No transfers on the desk yet.')).toBeTruthy();
  });

  test('my offers tab: received and sent offers with their status', () => {
    const { getByText, getAllByText } = render(<MercatoScreen />);
    fireEvent.press(getByText('My offers · 2'));
    expect(getAllByText('Storm United')).toHaveLength(2);
    expect(getByText('Vix')).toBeTruthy();
    expect(getByText('Pending')).toBeTruthy();
    expect(getByText('In talks')).toBeTruthy();
    expect(getByText('Declined')).toBeTruthy();
    expect(getAllByText(/Received · Squad · 40 STC \/ week/).length).toBe(2);
    expect(getByText(/Sent · Squad/)).toBeTruthy();
  });

  test('a live received offer opens the inbox, a sent one opens the player', () => {
    const { getByText, getByLabelText } = render(<MercatoScreen />);
    fireEvent.press(getByText('My offers · 2'));
    fireEvent.press(getByLabelText('Storm United, Pending'));
    expect(mockPush).toHaveBeenCalledWith('/apps/inbox');
    fireEvent.press(getByLabelText('Vix, In talks'));
    expect(mockPush).toHaveBeenLastCalledWith({ pathname: '/(tabs)/profile/profilescreen', params: { playerId: 'p7' } });
  });

  test('my offers empty and error states', () => {
    mockOffers = resource([]);
    const empty = render(<MercatoScreen />);
    fireEvent.press(empty.getByText('My offers'));
    expect(empty.getByText('No contract offers yet.')).toBeTruthy();
    empty.unmount();

    mockOffers = resource(undefined, { error: 'Offers down' });
    const failed = render(<MercatoScreen />);
    fireEvent.press(failed.getByText('My offers'));
    expect(failed.getByText('Offers down')).toBeTruthy();
    fireEvent.press(failed.getByText('Retry'));
    expect(mockOffers.refetch).toHaveBeenCalled();
  });

  test('the Free agents tab shows the market view', () => {
    const { getByText } = render(<MercatoScreen />);
    fireEvent.press(getByText('Free agents'));
    expect(getByText('free-agents-view')).toBeTruthy();
  });

  test('Back leaves the screen', () => {
    const { getByLabelText } = render(<MercatoScreen />);
    fireEvent.press(getByLabelText('Back'));
    expect(mockBack).toHaveBeenCalled();
  });
});
