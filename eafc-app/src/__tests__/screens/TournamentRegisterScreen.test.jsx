import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import useThemeStore from '../../store/themeStore';

jest.setTimeout(20000);

const mockRefetch = jest.fn(() => Promise.resolve());
let mockResource;

jest.mock('expo-router', () => ({
  useRouter: () => ({ back: jest.fn(), push: jest.fn(), canGoBack: () => true }),
  useLocalSearchParams: () => ({ tournamentId: 't1' }),
}));
jest.mock('expo-linear-gradient', () => {
  const ReactModule = require('react');
  const { View } = require('react-native');
  return { LinearGradient: ({ children, style }) => ReactModule.createElement(View, { style }, children) };
});
jest.mock('../../hooks/useTournamentRegister', () => ({ __esModule: true, default: () => mockResource }));

const mockSubmit = jest.fn(() => Promise.resolve({}));
jest.mock('../../lib/tournamentRegister', () => ({
  ...jest.requireActual('../../lib/tournamentRegister'),
  submitTournamentRegistration: (...a) => mockSubmit(...a),
  withdrawTournamentRegistration: jest.fn(),
}));

import TournamentRegisterScreen from '../../app/apps/tournament-register';

function resource(data, over = {}) {
  return { data, loading: false, error: null, refreshing: false, refetch: mockRefetch, ...over };
}

describe('TournamentRegister screen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useThemeStore.getState().setStageTheme('theme-dark');
    mockResource = resource({
      tournament: { id: 't1', name: 'Autumn Champions Cup', status: 'registration', type: 'group_stage', platform: 'PS5' },
      club: { id: 'c1', name: 'Night Owls FC' },
      isPresident: true,
      playerTournament: false,
      canRegister: true,
      clubEntered: false,
      clubPending: false,
      full: false,
      open: true,
      metaLine: 'Groups + KO · PS5 · 12 / 16 clubs',
      clubInitials: 'NOW',
      rules: { body: 'Matches 2 × 6 min · report within 2 h.', templateId: 'standard_cup' },
      rulesRevision: 3,
      slots: [
        { id: 'a', label: 'Wed 21h', selected: true },
        { id: 'b', label: 'Fri 21h', selected: false },
      ],
      selectedSlotIds: ['a'],
    });
  });

  test('renders registration mockup and registers after rules acceptance', async () => {
    const r = render(<TournamentRegisterScreen />);
    await waitFor(() => r.getByText('REGISTRATION'));
    expect(r.getByText('AUTUMN CHAMPIONS CUP')).toBeTruthy();
    expect(r.getByText('Night Owls FC')).toBeTruthy();
    expect(r.getByText('OPEN')).toBeTruthy();
    const apply = r.getByLabelText('Register my club');
    expect(apply.props.accessibilityState.disabled).toBe(true);
    fireEvent.press(r.getByLabelText('I accept the rules for my club'));
    fireEvent.press(r.getByLabelText('Register my club'));
    await waitFor(() => expect(mockSubmit).toHaveBeenCalled());
  });
});
