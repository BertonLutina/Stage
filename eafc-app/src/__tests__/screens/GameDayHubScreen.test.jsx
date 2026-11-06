import React from 'react';
import { StyleSheet } from 'react-native';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import useThemeStore from '../../store/themeStore';

const mockPush = jest.fn();
const mockReload = jest.fn(() => Promise.resolve());
let mockHub;
let mockArrangeProps = null;

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: (...a) => mockPush(...a) }),
  useLocalSearchParams: () => ({}),
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
    entities: { GameDayConfig: { filter: () => Promise.resolve([{ banner_url: null }]) } },
    http: { get: jest.fn(() => Promise.resolve({ events: [], timezone: 'Europe/Brussels' })) },
  },
  resolveMyPlayerAndClub: jest.fn(() => Promise.resolve({ player: null })),
}));
jest.mock('../../hooks/useMatchesHub', () => ({
  __esModule: true,
  GAME_DAY_SCOPES: [
    { id: 'general', label: 'General' },
    { id: 'gost', label: 'GOST' },
  ],
  GAME_DAY_STATUSES: [
    { id: 'all', label: 'All' },
    { id: 'live', label: 'Live' },
  ],
  default: () => mockHub,
}));
jest.mock('../../components/matches/ArrangeGameModal', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return {
    __esModule: true,
    default: (props) => {
      mockArrangeProps = props;
      return props.visible ? React.createElement(Text, null, 'arrange-modal-open') : null;
    },
  };
});
jest.mock('../../components/matches/GameDayResultSheet', () => ({ __esModule: true, default: () => null }));
jest.mock('../../components/matches/GameDayTileBackgroundDialog', () => ({ __esModule: true, default: () => null }));

const MatchesIndex = require('../../app/(tabs)/matches/index').default;

const HEX = /#[0-9A-Fa-f]{6}\b/;

function match(over = {}) {
  return {
    id: 'm1',
    status: 'scheduled',
    home_club_name: 'Night Owls',
    away_club_name: 'Red Foxes',
    scheduled_date: '2026-11-02T21:00:00Z',
    ...over,
  };
}

function event(over = {}) {
  return {
    id: 'm1',
    homeName: 'Night Owls',
    awayName: 'Red Foxes',
    date: '2026-11-02T21:00:00Z',
    status: 'scheduled',
    competition: 'League',
    opposition: 'Red Foxes',
    venue: 'Home',
    isMyClub: false,
    hasStream: false,
    matchData: match(),
    ...over,
  };
}

function hubWith(over = {}) {
  return {
    loading: false,
    error: '',
    reload: mockReload,
    live: [],
    upcoming: [],
    results: [],
    filteredGameDay: [],
    leagueGroups: [],
    leagueFilter: 'all',
    setLeagueFilter: jest.fn(),
    scopeFilter: 'general',
    setScopeFilter: jest.fn(),
    statusFilter: 'all',
    setStatusFilter: jest.fn(),
    backendNotice: '',
    myClub: null,
    presidentClub: null,
    myPlayer: null,
    setMyPlayer: jest.fn(),
    ...over,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  mockArrangeProps = null;
  const store = {};
  global.localStorage = {
    getItem: (key) => (Object.prototype.hasOwnProperty.call(store, key) ? store[key] : null),
    setItem: (key, value) => { store[String(key)] = String(value); },
    removeItem: (key) => { delete store[String(key)]; },
  };
});

describe.each(['theme-dark', 'theme-video'])('Game Day hub in %s', (theme) => {
  beforeEach(() => useThemeStore.getState().setStageTheme(theme));

  test('empty account keeps the empty states and the Arrange Game entry', async () => {
    mockHub = hubWith();
    const { getByText, getAllByLabelText, queryByText } = render(<MatchesIndex />);
    expect(getByText('Game Day')).toBeTruthy();
    expect(getByText('No scheduled games')).toBeTruthy();
    expect(getByText('SELECT A GAME TO VIEW DETAILS')).toBeTruthy();
    expect(queryByText('arrange-modal-open')).toBeNull();
    fireEvent.press(getAllByLabelText('Arrange Game')[0]);
    expect(getByText('arrange-modal-open')).toBeTruthy();
    await waitFor(() => expect(mockArrangeProps.visible).toBe(true));
  });

  test('Fixtures / Calendar / Results segments show one section at a time', async () => {
    mockHub = hubWith();
    const { getByLabelText, getByText, queryByText, findByText } = render(<MatchesIndex />);
    expect(getByText('MATCH SCREENS')).toBeTruthy();
    expect(queryByText('Match results')).toBeNull();

    fireEvent.press(getByLabelText('Calendar'));
    expect(queryByText('MATCH SCREENS')).toBeNull();
    expect(getByText('Schedule')).toBeTruthy();
    expect(await findByText('No confirmed games on this day')).toBeTruthy();

    fireEvent.press(getByLabelText('Results'));
    expect(queryByText('Schedule')).toBeNull();
    expect(getByText('Match results')).toBeTruthy();
    expect(getByText('No results yet')).toBeTruthy();

    fireEvent.press(getByLabelText('Fixtures'));
    expect(getByText('MATCH SCREENS')).toBeTruthy();
  });

  test('results list renders one card per finished match and opens match detail', () => {
    const done = event({
      id: 'r1',
      status: 'completed',
      opposition: 'Blue Comets',
      result: { outcome: 'W', display: '3-1' },
      matchData: match({ id: 'r1', status: 'completed' }),
    });
    mockHub = hubWith({ results: [done] });
    const { getByLabelText, getByText } = render(<MatchesIndex />);
    fireEvent.press(getByLabelText('Results'));
    expect(getByText('Blue Comets')).toBeTruthy();
    expect(getByText('3-1')).toBeTruthy();
    fireEvent.press(getByLabelText(/^Blue Comets, League, /));
    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/(tabs)/matches/matchdetailscreen',
      params: { matchId: 'r1' },
    });
  });

  test('fixtures: the first game is featured and Live Stream / Chat act on it', () => {
    const upcoming = [event(), event({ id: 'm2', awayName: 'Iron Wolves', matchData: match({ id: 'm2' }) })];
    mockHub = hubWith({ upcoming, filteredGameDay: upcoming });
    const { getByLabelText, getByText } = render(<MatchesIndex />);
    expect(getByText('2/2 visible')).toBeTruthy();
    expect(getByLabelText(/^Night Owls versus Red Foxes, /)).toBeTruthy();

    fireEvent.press(getByLabelText('Chat'));
    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/(tabs)/matches/watchmatchscreen',
      params: { matchId: 'm1' },
    });

    fireEvent.press(getByLabelText(/^Night Owls versus Iron Wolves, /));
    fireEvent.press(getByLabelText('Live Stream'));
    expect(mockPush).toHaveBeenLastCalledWith({
      pathname: '/(tabs)/matches/matchdetailscreen',
      params: { matchId: 'm2' },
    });
  });

  test('Live Stream and Chat stay inert without a featured game', () => {
    mockHub = hubWith();
    const { getByLabelText } = render(<MatchesIndex />);
    fireEvent.press(getByLabelText('Chat'));
    fireEvent.press(getByLabelText('Live Stream'));
    expect(mockPush).not.toHaveBeenCalled();
  });

  test('filter chips call the hub setters', () => {
    const hub = hubWith();
    mockHub = hub;
    const { getByText } = render(<MatchesIndex />);
    fireEvent.press(getByText('GOST'));
    expect(hub.setScopeFilter).toHaveBeenCalledWith('gost');
    fireEvent.press(getByText('Live'));
    expect(hub.setStatusFilter).toHaveBeenCalledWith('live');
  });

  test('error and backend notice branches stay; Retry reloads', () => {
    mockHub = hubWith({ error: 'Could not load matches', backendNotice: 'Backend is catching up' });
    const { getByText } = render(<MatchesIndex />);
    expect(getByText('Could not load matches')).toBeTruthy();
    expect(getByText('Backend is catching up')).toBeTruthy();
    fireEvent.press(getByText('Retry'));
    expect(mockReload).toHaveBeenCalled();
  });

  test('loading state shows a spinner instead of the hub', () => {
    mockHub = hubWith({ loading: true });
    const { queryByText } = render(<MatchesIndex />);
    expect(queryByText('Game Day')).toBeNull();
  });

  test('no hex colour leaks into rendered styles', async () => {
    const upcoming = [event({ isMyClub: true, hasStream: true })];
    mockHub = hubWith({ upcoming, filteredGameDay: upcoming, results: [event({ id: 'r1', status: 'completed' })] });
    const { toJSON, findByText } = render(<MatchesIndex />);
    await findByText('Game Day');
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
    expect(seen.filter((v) => !allowed.has(v))).toEqual([]);
  });
});
