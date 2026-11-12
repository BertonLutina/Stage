import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import useThemeStore from '../../store/themeStore';

jest.setTimeout(30000);

const mockBack = jest.fn();
const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ back: mockBack, push: mockPush }),
  useLocalSearchParams: () => ({ id: 'c1' }),
}));
jest.mock('expo-linear-gradient', () => {
  const ReactModule = require('react');
  const { View } = require('react-native');
  return { LinearGradient: ({ children, style }) => ReactModule.createElement(View, { style }, children) };
});
jest.mock('react-native-safe-area-context', () => {
  const ReactModule = require('react');
  const { View } = require('react-native');
  return {
    SafeAreaView: ({ children, style }) => ReactModule.createElement(View, { style }, children),
    useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  };
});

jest.mock('../../api/stageClient', () => ({
  resolveMyPlayerAndClub: jest.fn(() => Promise.resolve({ presidentClub: { id: 'mine' } })),
}));

let mockTeam;
jest.mock('../../hooks/useTeam', () => ({ __esModule: true, default: () => mockTeam }));
jest.mock('../../app/(tabs)/profile/clubProfileTabs', () => ({ __esModule: true, default: () => null }));
jest.mock('../../components/profile/FollowToggleButton', () => ({ __esModule: true, default: () => null }));
jest.mock('../../components/club/ClubHero', () => {
  const ReactModule = require('react');
  const { Text, View } = require('react-native');
  return {
    __esModule: true,
    default: ({ club, extraActions }) => ReactModule.createElement(View, null, ReactModule.createElement(Text, null, club.name), extraActions),
  };
});
jest.mock('../../components/profile/gamer/GamerProfileUI', () => {
  const ReactModule = require('react');
  const { View } = require('react-native');
  return { GamerProfileShell: ({ children }) => ReactModule.createElement(View, null, children) };
});

const ClubScreen = require('../../app/apps/club/[id]').default;

const match = (id, home, away, hs, as, date, extra = {}) => ({
  id, status: 'completed', home_club_id: home, away_club_id: away, home_score: hs, away_score: as,
  home_club_name: home === 'c1' ? 'Red Foxes' : `Club ${home}`,
  away_club_name: away === 'c1' ? 'Red Foxes' : `Club ${away}`,
  scheduled_date: date, ...extra,
});

function team(matches) {
  return {
    data: { bundle: { club: { id: 'c1', name: 'Red Foxes' }, players: [{ id: 'p' }], matches, trophies: [], record: { wins: 1, draws: 1, losses: 1, totalGames: 3, winRate: 33 } } },
    loading: false, error: null, refreshing: false, refetch: jest.fn(),
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  useThemeStore.getState().setStageTheme('theme-dark');
});

describe('Public club screen', () => {
  test('shows the last real results, newest first, from the club point of view', async () => {
    mockTeam = team([
      match('a', 'c1', 'x', 1, 3, '2026-01-01T10:00:00Z', { competition_name: 'Euro Pro League' }),
      match('b', 'y', 'c1', 2, 2, '2026-01-03T10:00:00Z'),
      match('c', 'c1', 'z', 4, 0, '2026-01-02T10:00:00Z'),
    ]);
    const { findByText, getByText, getAllByLabelText } = render(<ClubScreen />);
    expect(await findByText('Last results')).toBeTruthy();
    expect(getByText('All competitions')).toBeTruthy();
    expect(getByText('at Club y')).toBeTruthy();
    expect(getByText('2 – 2')).toBeTruthy();
    expect(getByText('vs Club z')).toBeTruthy();
    expect(getByText('4 – 0')).toBeTruthy();
    expect(getByText('vs Club x')).toBeTruthy();
    expect(getByText('1 – 3')).toBeTruthy();
    expect(getByText('Euro Pro League')).toBeTruthy();
    expect(getAllByLabelText('Win').length).toBeGreaterThan(0);
    expect(getAllByLabelText('Loss').length).toBeGreaterThan(0);
    expect(getAllByLabelText('Draw').length).toBeGreaterThan(0);
  });

  test('recent form runs oldest to newest, so the last chip is the latest match', async () => {
    mockTeam = team([
      match('a', 'c1', 'x', 1, 3, '2026-01-01T10:00:00Z'),
      match('b', 'c1', 'z', 4, 0, '2026-01-02T10:00:00Z'),
      match('c', 'y', 'c1', 2, 2, '2026-01-03T10:00:00Z'),
    ]);
    const { findByTestId } = render(<ClubScreen />);
    const form = await findByTestId('club-recent-form');
    const chips = form.findAll((n) => typeof n.type === 'string' && n.props?.accessibilityLabel && ['Win', 'Draw', 'Loss'].includes(n.props.accessibilityLabel));
    expect(chips.map((n) => n.props.accessibilityLabel)).toEqual(['Loss', 'Win', 'Draw']);
  });

  test('no head-to-head block anywhere (no endpoint for it)', async () => {
    mockTeam = team([match('a', 'c1', 'x', 1, 0, '2026-01-01T10:00:00Z')]);
    const { findByText, queryByText } = render(<ClubScreen />);
    await findByText('Last results');
    expect(queryByText(/head.?to.?head|h2h/i)).toBeNull();
  });

  test('an empty club says so instead of showing made-up results', async () => {
    mockTeam = team([]);
    const { findByText, queryByTestId } = render(<ClubScreen />);
    expect(await findByText('No results yet')).toBeTruthy();
    expect(queryByTestId('club-recent-form')).toBeNull();
  });

  test('unscored or unfinished matches are left out', async () => {
    mockTeam = team([
      match('a', 'c1', 'x', null, null, '2026-01-01T10:00:00Z'),
      match('b', 'c1', 'z', 1, 0, '2026-01-02T10:00:00Z', { status: 'scheduled' }),
    ]);
    const { findByText } = render(<ClubScreen />);
    expect(await findByText('No results yet')).toBeTruthy();
  });

  test('keeps Challenge for another president, and the existing loading and error states', async () => {
    mockTeam = team([]);
    const { findByText } = render(<ClubScreen />);
    fireEvent.press(await findByText('CHALLENGE'));
    await waitFor(() => expect(mockPush).toHaveBeenCalled());
    expect(mockPush.mock.calls[0][0].params).toMatchObject({ arrange: '1', opponentId: 'c1' });

    mockTeam = { data: null, loading: false, error: 'boom', refreshing: false, refetch: jest.fn() };
    const failed = render(<ClubScreen />);
    expect(await failed.findByText('boom')).toBeTruthy();
    fireEvent.press(failed.getByText('Try again'));
    expect(mockTeam.refetch).toHaveBeenCalled();
  });
});
