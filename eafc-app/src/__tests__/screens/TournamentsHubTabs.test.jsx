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
    canCreate: false,
    trophyItems: [],
    open: [{ id: 'open-1', name: 'Open Cup', status: 'registration', max_teams: 16, registered_clubs: [] }],
    my: [],
    finished: [],
  }),
}));
jest.mock('../../components/competitions/CompetitionsView', () => {
  const ReactModule = require('react');
  const { Text } = require('react-native');
  return { __esModule: true, default: () => ReactModule.createElement(Text, null, 'competitions-view') };
});
jest.mock('../../components/rankings/RankingsView', () => {
  const ReactModule = require('react');
  const { Text } = require('react-native');
  return { __esModule: true, default: () => ReactModule.createElement(Text, null, 'rankings-view') };
});

import TournamentListScreen from '../../app/(tabs)/tournaments/tournamentlistscreen';

describe('Tournaments screen tabs (Tournois | Compétitions | Classements)', () => {
  beforeEach(() => jest.clearAllMocks());

  test('shows the three straight tabs and starts on the tournaments list', () => {
    const { getByLabelText, getByText, queryByText } = render(<TournamentListScreen />);
    expect(getByLabelText('Tournaments')).toBeTruthy();
    expect(getByLabelText('Competitions')).toBeTruthy();
    expect(getByLabelText('Rankings')).toBeTruthy();
    expect(getByText('Open Cup')).toBeTruthy();
    expect(queryByText('competitions-view')).toBeNull();
    expect(queryByText('rankings-view')).toBeNull();
  });

  test('switches to Competitions and Rankings without leaving the screen', () => {
    const { getByLabelText, getByText, queryByText } = render(<TournamentListScreen />);

    fireEvent.press(getByLabelText('Competitions'));
    expect(getByText('competitions-view')).toBeTruthy();
    expect(queryByText('Open Cup')).toBeNull();

    fireEvent.press(getByLabelText('Rankings'));
    expect(getByText('rankings-view')).toBeTruthy();
    expect(queryByText('competitions-view')).toBeNull();

    fireEvent.press(getByLabelText('Tournaments'));
    expect(getByText('Open Cup')).toBeTruthy();
    expect(mockPush).not.toHaveBeenCalled();
  });
});
