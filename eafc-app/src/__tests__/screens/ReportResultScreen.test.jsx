import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
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
jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: jest.fn(async () => ({ status: 'granted' })),
  launchImageLibraryAsync: jest.fn(async () => ({ canceled: true })),
  MediaTypeOptions: { Images: 'Images' },
}));
jest.mock('../../hooks/useMatchResultScreen', () => ({ __esModule: true, default: () => mockResource }));
jest.mock('../../api/stageClient', () => ({
  stageClient: {
    entities: { Player: { filter: jest.fn(async () => []) }, ClubFixtureLineup: { filter: jest.fn(async () => []) } },
    integrations: { Core: { UploadFile: jest.fn() } },
  },
}));

import ReportResultScreen from '../../app/apps/report-result';

function resource(data, over = {}) {
  return { data, loading: false, error: null, refreshing: false, refetch: mockRefetch, ...over };
}

const payload = {
  match: {
    id: 'm1',
    status: 'in_progress',
    competition_context: 'Regional league',
    home_club_id: 'c1',
    away_club_id: 'c2',
    home_club_name: 'Night Owls',
    away_club_name: 'Red Foxes',
    mode: 'club',
  },
  club: { id: 'c1', name: 'Night Owls' },
  player: { id: 'p1' },
  sides: {
    homeName: 'Night Owls',
    awayName: 'Red Foxes',
    isMyMatch: true,
    amIHomeTeam: true,
    isClubMatch: true,
  },
  controls: { showHomeSubmit: true },
};

describe('ReportResult screen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useThemeStore.getState().setStageTheme('theme-dark');
    mockResource = resource(payload);
  });

  test('renders the mockup eyebrow, score steppers and send CTA', async () => {
    mockResource = resource(undefined, { loading: true });
    const loading = render(<ReportResultScreen />);
    expect(loading.getByTestId('skeleton-list')).toBeTruthy();
    loading.unmount();

    mockResource = resource(payload);
    const r = render(<ReportResultScreen />);
    await waitFor(() => r.getByText(/Report result/i));
    expect(r.getByText(/Full time/i)).toBeTruthy();
    expect(r.getByText('Night Owls')).toBeTruthy();
    expect(r.getByText('Red Foxes')).toBeTruthy();
    expect(r.getByLabelText('Send the score')).toBeTruthy();
    expect(r.getByTestId('report-result-cta')).toBeTruthy();
  });
});
