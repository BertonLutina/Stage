import React from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';

const mockPush = jest.fn();
const mockRefetch = jest.fn();
let mockResource;

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, back: jest.fn() }),
}));
jest.mock('expo-linear-gradient', () => {
  const ReactModule = require('react');
  const { View } = require('react-native');
  return { LinearGradient: ({ children, style }) => ReactModule.createElement(View, { style }, children) };
});
jest.mock('../../api/stageClient', () => ({
  resolveMyPlayerAndClub: jest.fn(() => Promise.resolve({})),
  stageClient: { http: { get: jest.fn(() => Promise.resolve({})) } },
}));
jest.mock('../../hooks/useRankings', () => ({
  __esModule: true,
  default: () => mockResource,
}));

import RankingsView from '../../components/rankings/RankingsView';

const club = (i, over = {}) => ({
  id: `c${i}`, name: `Club ${i}`, tag: `C${i}`, region: i % 2 ? 'Europe' : 'Asia', platform: i % 3 ? 'PS5' : 'Xbox',
  wins: 20 - i, draws: 2, losses: i, matches_ranked: 22, ranking_points: 2000 - i * 10, ...over,
});
const player = (i) => ({
  id: `p${i}`, gamertag: `Gamer ${i}`, position: 'ST', club_name: `Club ${i}`, region: 'Europe', platform: 'PS5',
  ranking_wins: 9 - i, ranking_draws: 1, ranking_losses: i, ranking_points: 900 - i * 5,
});

function resource({ clubs = 15, players = 3, full = true, me = {}, ...overrides } = {}) {
  return {
    data: {
      clubs: Array.from({ length: clubs }, (_, k) => club(k + 1)),
      players: Array.from({ length: players }, (_, k) => player(k + 1)),
      fullAccess: full,
      club: { id: 'c12', name: 'Club 12', ...me.club },
      player: { id: 'p2', gamertag: 'Gamer 2', ...me.player },
    },
    loading: false,
    error: null,
    refreshing: false,
    refetch: mockRefetch,
    ...overrides,
  };
}

describe('RankingsView', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockResource = resource();
  });

  test('loading shows skeletons', () => {
    mockResource = resource({ loading: true, data: undefined });
    const { getByTestId } = render(<RankingsView />);
    expect(getByTestId('skeleton-list')).toBeTruthy();
  });

  test('error shows the message and Retry refetches', () => {
    mockResource = resource({ error: 'Network down' });
    const { getByText } = render(<RankingsView />);
    fireEvent.press(getByText('Retry'));
    expect(mockRefetch).toHaveBeenCalled();
    expect(getByText('Network down')).toBeTruthy();
  });

  test('hands refresh state to the parent for pull-to-refresh', () => {
    const onRefreshState = jest.fn();
    render(<RankingsView onRefreshState={onRefreshState} />);
    expect(onRefreshState).toHaveBeenCalledWith({ refreshing: false, refetch: mockRefetch });
  });

  test('clubs table: real columns, my club pinned below the top ten with its real rank', () => {
    const { getByText, getAllByLabelText, getByLabelText, queryByLabelText } = render(<RankingsView />);
    expect(getByText('W-D-L')).toBeTruthy();
    expect(getByText('PTS')).toBeTruthy();
    expect(getByLabelText('1, Club 1, 19-2-1')).toBeTruthy();
    expect(queryByLabelText(/^11, Club 11/)).toBeNull();
    // my club is #12 and pinned after the top ten
    const mine = getByLabelText('12, Club 12, 8-2-12');
    expect(mine).toBeTruthy();
    expect(getByText('Your club')).toBeTruthy();
    expect(getAllByLabelText(/, Club \d+,/)).toHaveLength(11);
    expect(getByText('1 880')).toBeTruthy();
  });

  test('Show more reveals the next rows and my row goes back in place', () => {
    const { getByText, getByLabelText, getAllByLabelText } = render(<RankingsView />);
    fireEvent.press(getByText('Show more'));
    expect(getByLabelText('11, Club 11, 9-2-11')).toBeTruthy();
    expect(getAllByLabelText(/, Club \d+,/)).toHaveLength(15);
  });

  test('tapping a club opens its profile', () => {
    const { getByLabelText } = render(<RankingsView />);
    fireEvent.press(getByLabelText('1, Club 1, 19-2-1'));
    expect(mockPush).toHaveBeenCalledWith({ pathname: '/apps/club/[id]', params: { id: 'c1' } });
  });

  test('players tab shows players, my player row, and opens the player profile', () => {
    const { getByText, getByLabelText } = render(<RankingsView />);
    fireEvent.press(getByText('Players'));
    expect(getByText('Player')).toBeTruthy();
    expect(getByLabelText('2, Gamer 2, 7-1-2')).toBeTruthy();
    expect(getByText('You')).toBeTruthy();
    fireEvent.press(getByLabelText('1, Gamer 1, 8-1-1'));
    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/(tabs)/profile/profilescreen', params: { playerId: 'p1' },
    });
  });

  test('platform filter narrows the list and the ranks follow the filtered order', () => {
    const { getByText, getByLabelText, queryByLabelText } = render(<RankingsView />);
    fireEvent.press(getByText('Xbox'));
    // Xbox clubs are 3, 6, 9, 12, 15
    expect(getByLabelText('1, Club 3, 17-2-3')).toBeTruthy();
    expect(queryByLabelText(/Club 1,/)).toBeNull();
    // my club (12) is 4th inside the filtered list
    expect(getByLabelText('4, Club 12, 8-2-12')).toBeTruthy();
    fireEvent.press(getByText('Xbox'));
    expect(getByLabelText('1, Club 1, 19-2-1')).toBeTruthy();
  });

  test('a filter with no match shows the empty state and Clear filters', () => {
    mockResource = resource({ clubs: 4, me: { club: { id: 'c1' } } });
    const { getByText, queryByText } = render(<RankingsView />);
    fireEvent.press(getByText('Asia'));
    fireEvent.press(getByText('Xbox'));
    expect(getByText('No result for these filters.')).toBeTruthy();
    fireEvent.press(getByText('Clear filters'));
    expect(queryByText('No result for these filters.')).toBeNull();
  });

  test('free account: no points column, no filters, Plus notice routes to the store', () => {
    mockResource = resource({ clubs: 10, full: false });
    const { queryByText, getByText } = render(<RankingsView />);
    expect(queryByText('PTS')).toBeNull();
    expect(queryByText('Xbox')).toBeNull();
    expect(getByText(/Free accounts see the top 10/)).toBeTruthy();
    fireEvent.press(getByText('Open Store'));
    expect(mockPush).toHaveBeenCalledWith('/apps/store');
  });

  test('free account outside the top ten: my row comes from my own record rank, not invented', () => {
    mockResource = resource({ clubs: 10, full: false, me: { club: { id: 'cx', name: 'Night Owls', global_rank: 57, wins: 4, draws: 1, losses: 2 } } });
    const { getByLabelText } = render(<RankingsView />);
    expect(getByLabelText('57, Night Owls, 4-1-2')).toBeTruthy();
  });

  test('my club not ranked and no rank on my record: no row for me', () => {
    mockResource = resource({ clubs: 10, me: { club: { id: 'cx', name: 'Night Owls' } } });
    const { queryByText } = render(<RankingsView />);
    expect(queryByText('Your club')).toBeNull();
  });

  test('empty rankings', () => {
    mockResource = resource({ clubs: 0, players: 0 });
    const { getByText } = render(<RankingsView />);
    expect(getByText('No ranked clubs yet.')).toBeTruthy();
  });

  test('footer note is shown', () => {
    const { getByText } = render(<RankingsView />);
    expect(getByText('Only ranked matches count. Your row stays visible.')).toBeTruthy();
  });
});
