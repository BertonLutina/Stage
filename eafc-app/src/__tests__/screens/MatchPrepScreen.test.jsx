import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import useThemeStore from '../../store/themeStore';

jest.setTimeout(20000);

const mockBack = jest.fn();
const mockRefetch = jest.fn(() => Promise.resolve());
let mockResource;

jest.mock('expo-router', () => ({
  useRouter: () => ({ back: mockBack, push: jest.fn(), canGoBack: () => true }),
  useLocalSearchParams: () => ({ matchId: 'm1' }),
}));
jest.mock('expo-linear-gradient', () => {
  const ReactModule = require('react');
  const { View } = require('react-native');
  return { LinearGradient: ({ children, style }) => ReactModule.createElement(View, { style }, children) };
});
jest.mock('../../hooks/useMatchPrep', () => ({ __esModule: true, default: () => mockResource }));

const mockPublish = jest.fn(() => Promise.resolve({}));
const mockDraft = jest.fn(() => Promise.resolve({}));
jest.mock('../../lib/matchPrep', () => ({
  ...jest.requireActual('../../lib/matchPrep'),
  publishMatchPrep: (...a) => mockPublish(...a),
  saveMatchPrepDraft: (...a) => mockDraft(...a),
}));

import MatchPrepScreen from '../../app/apps/match-prep';

function resource(data, over = {}) {
  return { data, loading: false, error: null, refreshing: false, refetch: mockRefetch, ...over };
}

const base = (over = {}) => ({
  match: {
    id: 'm1',
    home_club_id: 'c1',
    away_club_id: 'c2',
    home_club_name: 'Night Owls',
    away_club_name: 'Red Foxes',
    competition_context: 'Regional league',
    scheduled_date: '2026-11-20T20:00:00Z',
    source_fixture_id: 'f1',
  },
  club: { id: 'c1', name: 'Night Owls' },
  fixtureId: 'f1',
  official: true,
  staff: true,
  published: false,
  players: [
    {
      id: 'p1', gamertag: 'NightOwl_10', initials: 'NO', position: 'ST',
      eligible: true, eligibilityMessage: null, availability: 'available', selected: true,
    },
    {
      id: 'p2', gamertag: 'Jun0', initials: 'JN', position: 'LW',
      eligible: false, eligibilityMessage: 'Not registered for this season', availability: 'available', selected: false,
    },
  ],
  availabilityCounts: { available: 9, maybe: 2, no_reply: 3 },
  maxStarters: 11,
  ...over,
});

describe('MatchPrep screen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useThemeStore.getState().setStageTheme('theme-dark');
    mockResource = resource(base());
  });

  test('loading shows skeleton; content shows eyebrow, staff tag, sticky CTAs', async () => {
    mockResource = resource(undefined, { loading: true });
    const loading = render(<MatchPrepScreen />);
    expect(loading.getByTestId('skeleton-list')).toBeTruthy();
    expect(loading.getByLabelText('Back')).toBeTruthy();
    loading.unmount();

    mockResource = resource(base());
    const r = render(<MatchPrepScreen />);
    await waitFor(() => r.getByText(/Match preparation/i));
    expect(r.getByText('STAFF')).toBeTruthy();
    expect(r.getByText(/vs Red Foxes/)).toBeTruthy();
    expect(r.getByText('NightOwl_10')).toBeTruthy();
    expect(r.getByText(/Ineligible/i)).toBeTruthy();
    expect(r.getByLabelText('Publish lineup')).toBeTruthy();
    expect(r.getByLabelText('Save draft')).toBeTruthy();
  });

  test('publish calls the preparation publish helper with selected ids', async () => {
    const r = render(<MatchPrepScreen />);
    await waitFor(() => r.getByLabelText('Publish lineup'));
    fireEvent.press(r.getByLabelText('Publish lineup'));
    await waitFor(() => expect(mockPublish).toHaveBeenCalledWith({
      clubId: 'c1', fixtureId: 'f1', playerIds: ['p1'],
    }));
  });

  test('a saved lineup closes the page', async () => {
    const r = render(<MatchPrepScreen />);
    await waitFor(() => r.getByLabelText('Publish lineup'));
    fireEvent.press(r.getByLabelText('Publish lineup'));
    await waitFor(() => expect(mockBack).toHaveBeenCalledTimes(1));

    mockBack.mockClear();
    fireEvent.press(r.getByLabelText('Save draft'));
    await waitFor(() => expect(mockBack).toHaveBeenCalledTimes(1));
  });

  test('a failed lineup save stays on the page', async () => {
    mockPublish.mockRejectedValueOnce(new Error('Lineup rejected'));
    const r = render(<MatchPrepScreen />);
    await waitFor(() => r.getByLabelText('Publish lineup'));
    fireEvent.press(r.getByLabelText('Publish lineup'));
    await waitFor(() => expect(r.getByText('Lineup rejected')).toBeTruthy());
    expect(mockBack).not.toHaveBeenCalled();
  });
});
