import React from 'react';
import { StyleSheet } from 'react-native';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import useThemeStore from '../../store/themeStore';

const mockPush = jest.fn();
const mockBack = jest.fn();
const mockReloadMatch = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: (...a) => mockPush(...a), back: (...a) => mockBack(...a) }),
  useLocalSearchParams: () => ({ matchId: 'm1' }),
}));
jest.mock('expo-linear-gradient', () => {
  const React = require('react');
  const { View } = require('react-native');
  return { LinearGradient: ({ children, style }) => React.createElement(View, { style }, children) };
});
jest.mock('expo-blur', () => {
  const React = require('react');
  const { View } = require('react-native');
  return { BlurView: ({ children, style }) => React.createElement(View, { style }, children) };
});
jest.mock('expo-image-picker', () => ({}));
jest.mock('@react-native-community/datetimepicker', () => 'DateTimePicker');
jest.mock('../../api/stageClient', () => ({
  stageClient: {
    auth: { me: () => Promise.resolve({}) },
    entities: {
      Club: { get: () => Promise.resolve(null) },
      Player: { get: () => Promise.resolve(null), filter: () => Promise.resolve([]) },
      ClubFixtureLineup: { filter: () => Promise.resolve([]) },
      Match: { update: jest.fn() },
    },
    http: { get: jest.fn(() => Promise.resolve({ items: [], total: 0, homeWins: 0, draws: 0, awayWins: 0, meetings: [] })) },
  },
  resolveMyPlayerAndClub: jest.fn(() => Promise.resolve({
    player: { id: 'p1', club_id: 'c1', gamertag: 'NightOwl' },
    club: { id: 'c1' },
    presidentClub: null,
  })),
}));
jest.mock('../../lib/gameDayOps', () => ({
  ...jest.requireActual('../../lib/gameDayOps'),
  reloadMatch: (...a) => mockReloadMatch(...a),
  settleClubMatches: jest.fn(() => Promise.resolve()),
  settleMatchDeadlines: jest.fn(() => Promise.resolve()),
  afterMatchCompleted: jest.fn(),
}));
jest.mock('../../hooks/useGameDayMatchRealtime', () => ({ useGameDayMatchRealtime: () => undefined }));
jest.mock('../../components/matches/GameDayResultSheet', () => ({ __esModule: true, default: () => null }));
jest.mock('../../components/matches/GameDayTileBackgroundDialog', () => ({ __esModule: true, default: () => null }));

const MatchDetailScreen = require('../../app/(tabs)/matches/matchdetailscreen').default;

const HEX = /#[0-9A-Fa-f]{6}\b/;
function strayHex(toJSON) {
  const seen = [];
  const walk = (node) => {
    if (!node || typeof node === 'string') return;
    if (node.props?.style) {
      const flat = StyleSheet.flatten(node.props.style) || {};
      Object.values(flat).forEach((v) => { if (typeof v === 'string' && HEX.test(v) && !seen.includes(v)) seen.push(v); });
    }
    (node.children || []).forEach(walk);
  };
  walk(toJSON());
  const tokens = useThemeStore.getState().tokens;
  const allowed = new Set(Object.values(tokens).filter((v) => typeof v === 'string'));
  return seen.filter((v) => !allowed.has(v));
}

const match = (over = {}) => ({
  id: 'm1',
  status: 'scheduled',
  mode: 'club',
  home_club_id: 'c1',
  away_club_id: 'c2',
  home_club_name: 'Night Owls',
  away_club_name: 'Red Foxes',
  scheduled_date: '2099-11-02T21:00:00Z',
  ...over,
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe.each(['theme-dark', 'theme-video'])('Match detail screen in %s', (theme) => {
  beforeEach(() => useThemeStore.getState().setStageTheme(theme));

  test('shows the match, Watch / Upload video route to their screens, back goes back', async () => {
    mockReloadMatch.mockResolvedValue(match({ status: 'completed', home_score: 3, away_score: 1 }));
    const { findByText, getByText, getAllByText, getByLabelText, toJSON } = render(<MatchDetailScreen />);
    expect(await findByText('GAME DAY')).toBeTruthy();
    expect(getAllByText('Night Owls').length).toBeGreaterThan(0);
    expect(getAllByText('Red Foxes').length).toBeGreaterThan(0);

    fireEvent.press(getByLabelText('Watch'));
    expect(mockPush).toHaveBeenCalledWith({ pathname: '/(tabs)/matches/watchmatchscreen', params: { matchId: 'm1' } });
    fireEvent.press(getByLabelText('Upload video'));
    expect(mockPush).toHaveBeenCalledWith({ pathname: '/(tabs)/matches/uploadvideoscreen', params: { matchId: 'm1' } });
    fireEvent.press(getByLabelText('Back'));
    expect(mockBack).toHaveBeenCalled();
    await waitFor(() => expect(getByText('Head-to-Head')).toBeTruthy());
    expect(getByText('STREAMS')).toBeTruthy();
    expect(strayHex(toJSON)).toEqual([]);
  });

  test('wager and stream sections stay on the page', async () => {
    mockReloadMatch.mockResolvedValue(match({ wager_stc: 2500, wager_status: 'active' }));
    const { findByText, getByText } = render(<MatchDetailScreen />);
    expect(await findByText('STC WAGER')).toBeTruthy();
    expect(getByText('Pot')).toBeTruthy();
    expect(getByText('STREAMS')).toBeTruthy();
  });

  test('a match that cannot be loaded shows the not-found state with a back button', async () => {
    mockReloadMatch.mockResolvedValue(null);
    const { findByText, getByLabelText } = render(<MatchDetailScreen />);
    expect(await findByText('Match not found')).toBeTruthy();
    fireEvent.press(getByLabelText('Back'));
    expect(mockBack).toHaveBeenCalled();
  });
});
