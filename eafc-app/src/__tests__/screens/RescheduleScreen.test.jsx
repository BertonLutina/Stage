import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import useThemeStore from '../../store/themeStore';

jest.setTimeout(20000);

const mockRefetch = jest.fn(() => Promise.resolve());
let mockResource;

jest.mock('expo-router', () => ({
  useRouter: () => ({ back: jest.fn(), push: jest.fn(), canGoBack: () => true }),
  useLocalSearchParams: () => ({ matchId: 'm1' }),
}));
jest.mock('expo-linear-gradient', () => {
  const ReactModule = require('react');
  const { View } = require('react-native');
  return { LinearGradient: ({ children, style }) => ReactModule.createElement(View, { style }, children) };
});
jest.mock('../../hooks/useOfficialReschedule', () => ({ __esModule: true, default: () => mockResource }));

const mockPost = jest.fn(() => Promise.resolve({}));
jest.mock('../../lib/officialReschedule', () => ({
  ...jest.requireActual('../../lib/officialReschedule'),
  postOfficialReschedule: (...a) => mockPost(...a),
}));

import RescheduleScreen from '../../app/apps/reschedule';

function resource(data, over = {}) {
  return { data, loading: false, error: null, refreshing: false, refetch: mockRefetch, ...over };
}

describe('Reschedule screen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useThemeStore.getState().setStageTheme('theme-dark');
    mockResource = resource({
      match: {
        id: 'm1',
        home_club_id: 'c1',
        away_club_id: 'c2',
        away_club_name: 'Red Foxes',
        competition_context: 'Regional league',
        scheduled_date: '2026-11-20T20:00:00Z',
        source_fixture_id: 'f1',
      },
      club: { id: 'c1', name: 'Night Owls' },
      staff: true,
      official: true,
      available: true,
      opponent: 'Red Foxes',
      slots: [
        { id: 's1', label: 'Fri 20:00' },
        { id: 's2', label: 'Sat 19:00' },
      ],
      history: [{ id: 'h1', text: 'Red Foxes proposed Sat 20:30', when: 'Tue', tone: 'info' }],
      pendingProposal: {
        id: 'pr1',
        label: 'Sat 15 Nov · 20:30',
        from: 'Red Foxes',
        when: '2 h ago',
      },
      windowLabel: 'Window ends Sun',
    });
  });

  test('renders staff header, proposal card, slots and propose CTA', async () => {
    const r = render(<RescheduleScreen />);
    await waitFor(() => r.getByText(/Reschedule/i));
    expect(r.getByText('STAFF')).toBeTruthy();
    expect(r.getByText(/vs Red Foxes/)).toBeTruthy();
    expect(r.getByText(/Sat 15 Nov/i)).toBeTruthy();
    expect(r.getByLabelText('Accept')).toBeTruthy();
    fireEvent.press(r.getByLabelText('Sat 19:00'));
    expect(r.getByLabelText('Propose Sat 19:00')).toBeTruthy();
  });
});
