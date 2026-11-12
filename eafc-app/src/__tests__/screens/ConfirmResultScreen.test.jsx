import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
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
jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: jest.fn(async () => ({ status: 'granted' })),
  launchImageLibraryAsync: jest.fn(async () => ({ canceled: true })),
  MediaTypeOptions: { Images: 'Images' },
}));
jest.mock('../../hooks/useMatchResultScreen', () => ({ __esModule: true, default: () => mockResource }));
jest.mock('../../api/stageClient', () => ({
  stageClient: { integrations: { Core: { UploadFile: jest.fn() } } },
}));

import ConfirmResultScreen from '../../app/apps/confirm-result';

function resource(data, over = {}) {
  return { data, loading: false, error: null, refreshing: false, refetch: mockRefetch, ...over };
}

describe('ConfirmResult screen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useThemeStore.getState().setStageTheme('theme-dark');
    mockResource = resource({
      match: {
        id: 'm1',
        status: 'awaiting_confirmation',
        result_state: 'AWAITING_AWAY_CONFIRMATION',
        confirmation_due_at: new Date(Date.now() + 3600000).toISOString(),
        home_submission: JSON.stringify({
          home_score: 1, away_score: 2, proof_url: null, submitted_by_gamertag: 'Vix',
        }),
        home_club_name: 'Night Owls',
        away_club_name: 'Red Foxes',
      },
      club: { id: 'c2', name: 'Red Foxes' },
      player: { id: 'p2' },
      sides: {
        homeName: 'Night Owls',
        awayName: 'Red Foxes',
        isMyMatch: true,
        amIHomeTeam: false,
      },
      controls: {
        showConfirmResult: true,
        submitSide: 'home',
      },
    });
  });

  test('renders waiting score card and confirm / dispute CTAs', async () => {
    const r = render(<ConfirmResultScreen />);
    await waitFor(() => r.getByText(/Confirm result/i));
    expect(r.getByText(/Waiting for you/i)).toBeTruthy();
    expect(r.getByText(/1 – 2/)).toBeTruthy();
    expect(r.getByLabelText('Confirm the score')).toBeTruthy();
    expect(r.getByLabelText('Dispute with my proof')).toBeTruthy();
    expect(r.getByTestId('confirm-result-cta')).toBeTruthy();
  });
});
