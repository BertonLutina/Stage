import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

const mockPush = jest.fn();
const mockRefetch = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, back: jest.fn() }),
}));
jest.mock('expo-linear-gradient', () => {
  const ReactModule = require('react');
  const { View } = require('react-native');
  return { LinearGradient: ({ children, style }) => ReactModule.createElement(View, { style }, children) };
});
jest.mock('../../hooks/useTournamentsList', () => ({
  __esModule: true,
  default: () => ({
    loading: false,
    error: null,
    refreshing: false,
    refetch: mockRefetch,
    canCreate: true,
    trophyItems: [],
    open: [
      { id: 'open-1', name: 'Open Cup', status: 'registration', max_teams: 16, registered_clubs: [] },
    ],
    my: [
      { id: 'my-1', name: 'My Champions Cup', status: 'in_progress', max_teams: 8, registered_clubs: [] },
    ],
    finished: [
      { id: 'done-1', name: 'Finished Cup', status: 'completed', max_teams: 8, registered_clubs: [] },
    ],
  }),
}));

import TournamentListScreen from '../../app/(tabs)/tournaments/tournamentlistscreen';

describe('Tournaments screen', () => {
  beforeEach(() => jest.clearAllMocks());

  test('matches the three mockup tabs and opens the selected real tournament', () => {
    const { getAllByText, getByText, queryByText } = render(<TournamentListScreen />);

    expect(getAllByText('Open').length).toBeGreaterThan(0);
    expect(getByText('My tournaments')).toBeTruthy();
    expect(getByText('Finished')).toBeTruthy();
    expect(getByText('Open Cup')).toBeTruthy();

    fireEvent.press(getByText('My tournaments'));
    expect(queryByText('Open Cup')).toBeNull();
    fireEvent.press(getByText('My Champions Cup'));
    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/(tabs)/tournaments/tournamentdetailscreen',
      params: { tournamentId: 'my-1' },
    });
  });

  test('create button opens the real create flow', () => {
    const { getByLabelText } = render(<TournamentListScreen />);
    fireEvent.press(getByLabelText('Create tournament'));
    expect(mockPush).toHaveBeenCalledWith('/(tabs)/tournaments/createtournamentscreen');
  });
});
