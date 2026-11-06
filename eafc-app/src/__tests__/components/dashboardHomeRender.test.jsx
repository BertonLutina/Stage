import React from 'react';
import { StyleSheet } from 'react-native';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import useThemeStore from '../../store/themeStore';

const mockFilter = jest.fn();
const mockInvoke = jest.fn(() => Promise.resolve({}));

jest.mock('expo-router', () => ({ useRouter: () => ({ push: jest.fn() }) }));
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
jest.mock('../../api/stageClient', () => ({
  stageClient: {
    entities: { ObjectiveProgress: { filter: (...a) => mockFilter(...a) } },
    functions: { invoke: (...a) => mockInvoke(...a) },
  },
  resolveMyPlayerAndClub: jest.fn(() => Promise.resolve({ player: null })),
}));
jest.mock('../../components/theme/PageTile', () => {
  const React = require('react');
  const { View } = require('react-native');
  return { __esModule: true, default: ({ children }) => React.createElement(View, null, children) };
});
jest.mock('../../components/profile/gamer/GamerProfileUI', () => {
  const React = require('react');
  const { View } = require('react-native');
  const useThemeStore = require('../../store/themeStore').default;
  return {
    useGamerTokens: () => useThemeStore((s) => s.tokens),
    FutIdentityCard: () => React.createElement(View, { testID: 'fut-card' }),
  };
});

const { DashboardLayoutBody } = require('../../components/dashboard/DashboardLayoutLab');
const { ObjectivesWidget, DashboardFormStrip } = require('../../components/dashboard/CommandCenterUI');

const HEX = /#[0-9A-Fa-f]{6}\b/;

function fullVm(open) {
  return {
    open,
    player: { id: 'p1', gamertag: 'NightOwl_10', avatar_url: null },
    club: { id: 'c1', name: 'Night Owls FC', tag: 'NOW', region: 'EU', logo_url: null },
    clubRank: { rank: 12, row: { ranking_points: 41, wins: 3, draws: 1, losses: 2 } },
    playerRank: { rank: 4 },
    nextMatch: { id: 'm1', scheduled_date: '2026-11-02T21:00:00Z', competition: 'League' },
    opponentInfo: { home: 'Night Owls', away: 'Red Foxes', isHome: true, opponent: 'Red Foxes' },
    upcomingMatches: [],
    activeTournaments: [],
    leagueStandings: [],
    activity: null,
    tenure: { contractLabel: '14 / 30', contractProgress: { gamesPlayed: 14, maxGames: 30, gamesPercent: 47, gamesLeft: 16 }, daysAtClub: 90 },
    glance: { stc: 1200, credits: 3, unreadInbox: 2, unreadNotifications: 1 },
    form: { stage: ['win', 'win', 'draw', 'loss', 'win'], rating: [7.8, 6.1] },
    gamertag: 'NightOwl_10',
    transferWindowOpen: true,
    wins: 3, draws: 1, losses: 2, avgRating: 7.8, winRate: 50, rankingPoints: 41,
    patchPlayer: jest.fn(),
  };
}

function emptyVm(open) {
  return {
    open,
    player: { id: 'p1' },
    club: null,
    clubRank: null,
    playerRank: null,
    nextMatch: null,
    opponentInfo: { home: 'TBD', away: 'TBD', isHome: true, opponent: 'TBD' },
    upcomingMatches: [],
    activeTournaments: [],
    leagueStandings: [],
    activity: null,
    tenure: null,
    glance: null,
    form: { stage: [], rating: [] },
    gamertag: 'Guest',
    transferWindowOpen: false,
    wins: 0, draws: 0, losses: 0, avgRating: 0, winRate: 0, rankingPoints: 0,
    patchPlayer: jest.fn(),
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  mockFilter.mockResolvedValue([]);
  const store = {};
  global.localStorage = {
    getItem: (key) => (Object.prototype.hasOwnProperty.call(store, key) ? store[key] : null),
    setItem: (key, value) => { store[String(key)] = String(value); },
    removeItem: (key) => { delete store[String(key)]; },
  };
});

describe.each(['theme-dark', 'theme-video'])('Home layouts in %s', (theme) => {
  beforeEach(() => useThemeStore.getState().setStageTheme(theme));

  test.each(['A', 'B', 'C', 'D', 'E'])('layout %s renders the hero, next match and form badges', async (layout) => {
    const open = jest.fn();
    const {
      getByTestId, getByText, getAllByText, getByLabelText, findByText,
    } = render(
      <DashboardLayoutBody layout={layout} vm={fullVm(open)} />,
    );
    expect(getByTestId('fut-card')).toBeTruthy();
    expect(getByText('Night Owls')).toBeTruthy();
    expect(getByText('Red Foxes')).toBeTruthy();
    expect(getByText('VS')).toBeTruthy();
    expect(getAllByText('W').length).toBeGreaterThan(0);
    fireEvent.press(getByLabelText('Next match versus Red Foxes'));
    expect(open).toHaveBeenCalledWith('/(tabs)/matches');
    fireEvent.press(getByLabelText('Transfers'));
    expect(open).toHaveBeenCalledWith('/apps/transfers');
    if (layout !== 'B') expect(await findByText('No open objectives.')).toBeTruthy();
  });

  test.each(['A', 'B', 'C', 'D', 'E'])('layout %s keeps its empty states with a bare account', async (layout) => {
    const { getByText, queryByLabelText, findByText } = render(
      <DashboardLayoutBody layout={layout} vm={emptyVm(jest.fn())} />,
    );
    expect(getByText('No fixture yet')).toBeTruthy();
    expect(queryByLabelText('Transfers')).toBeNull();
    if (layout !== 'B') expect(await findByText('No open objectives.')).toBeTruthy();
  });
});

describe('Home hero form pips', () => {
  beforeEach(() => useThemeStore.getState().setStageTheme('theme-dark'));

  test('the five form badges wrap instead of running off a narrow screen', () => {
    const { getAllByText } = render(
      <DashboardLayoutBody layout="A" vm={fullVm(jest.fn())} />,
    );
    // vm.form.stage has five results: W W D L W
    const badge = getAllByText('D')[0];
    let node = badge.parent;
    let row = null;
    while (node && !row) {
      const flat = StyleSheet.flatten(node.props?.style) || {};
      if (flat.flexDirection === 'row' && flat.gap === 6) row = flat;
      node = node.parent;
    }
    expect(row).not.toBeNull();
    expect(row.flexWrap).toBe('wrap');
  });
});

describe('Home widgets', () => {
  beforeEach(() => useThemeStore.getState().setStageTheme('theme-dark'));

  test('form strip maps outcomes to W / D / L badges and keeps the empty copy', () => {
    const { getByText, rerender } = render(
      <DashboardFormStrip label="Stage form" items={['win', 'draw', 'loss']} emptyLabel="Nothing yet" />,
    );
    ['W', 'D', 'L'].forEach((letter) => expect(getByText(letter)).toBeTruthy());
    rerender(<DashboardFormStrip label="Stage form" items={[]} emptyLabel="Nothing yet" />);
    expect(getByText('Nothing yet')).toBeTruthy();
  });

  test('objectives: claimable rows offer a claim button that invokes the claim function', async () => {
    mockFilter.mockResolvedValue([
      { id: 'o1', title: 'Play 3 league matches', progress: 3, target: 3, scope: 'daily' },
      { id: 'o2', title: 'Score in 2 matches', progress: 1, target: 2, scope: 'weekly' },
    ]);
    const { findByText, getByLabelText, queryByLabelText } = render(<ObjectivesWidget playerId="p1" />);
    expect(await findByText('Play 3 league matches')).toBeTruthy();
    expect(queryByLabelText('Claim reward for Score in 2 matches')).toBeNull();
    fireEvent.press(getByLabelText('Claim reward for Play 3 league matches'));
    await waitFor(() => expect(mockInvoke).toHaveBeenCalledWith('claimObjectiveReward', { progress_id: 'o1' }));
  });

  test('objectives: error and empty branches stay', async () => {
    mockFilter.mockRejectedValueOnce(new Error('boom'));
    const { findByText, unmount } = render(<ObjectivesWidget playerId="p1" />);
    expect(await findByText('boom')).toBeTruthy();
    unmount();
    mockFilter.mockResolvedValueOnce([]);
    const second = render(<ObjectivesWidget playerId="p1" />);
    expect(await second.findByText('No open objectives.')).toBeTruthy();
  });

  test('no hex colour leaks into rendered styles', async () => {
    const { toJSON, findByText } = render(<DashboardLayoutBody layout="A" vm={fullVm(jest.fn())} />);
    await findByText('No open objectives.');
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
    // token hex values are fine: every rendered colour must be a Stage token value
    const tokens = useThemeStore.getState().tokens;
    const allowed = new Set(Object.values(tokens).filter((v) => typeof v === 'string'));
    expect(seen.filter((v) => !allowed.has(v))).toEqual([]);
  });
});
