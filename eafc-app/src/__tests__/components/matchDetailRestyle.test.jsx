import React from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import useThemeStore from '../../store/themeStore';

const mockPlayerFilter = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
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
jest.mock('../../lib/uploadProfileMedia', () => ({ uploadLocalMedia: jest.fn() }));
jest.mock('../../api/stageClient', () => ({
  stageClient: {
    auth: { me: () => Promise.resolve({}) },
    entities: {
      Player: { filter: (...a) => mockPlayerFilter(...a), list: () => Promise.resolve([]) },
      ClubFixtureLineup: { filter: () => Promise.resolve([]) },
    },
    http: { get: jest.fn(() => Promise.resolve({ applicable: false })), patch: jest.fn() },
    integrations: { Core: { UploadFile: jest.fn() } },
  },
}));

const { GameDayFixtureChip, GameDayMatchCard, ScheduleMatchRow, fixtureAccessibilityLabel } = require('../../components/matches/MatchHubCards');
const GameDayResultSheet = require('../../components/matches/GameDayResultSheet').default;
const GameDayWagerCard = require('../../components/matches/GameDayWagerCard').default;
const GameDayStreamCard = require('../../components/matches/GameDayStreamCard').default;
const GameDayFixtureActions = require('../../components/matches/GameDayFixtureActions').default;
const GameDayInsights = require('../../components/matches/GameDayInsights').default;
const ScheduleCalendar = require('../../components/schedule/ScheduleCalendar');

const { categoryColor, categoryShape, markerStyle, CategoryDot } = ScheduleCalendar;
const Calendar = ScheduleCalendar.default;

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

beforeEach(() => {
  jest.clearAllMocks();
  mockPlayerFilter.mockResolvedValue([]);
});

describe.each(['theme-dark', 'theme-video'])('Match detail restyle in %s', (theme) => {
  beforeEach(() => useThemeStore.getState().setStageTheme(theme));

  test('calendar markers: every tier family has its own shape, colours still come from tokens', () => {
    const tokens = useThemeStore.getState().tokens;
    const shapeOf = (id) => {
      const { width, height, borderRadius, borderWidth, transform } = markerStyle(categoryShape(id), categoryColor(id, tokens), 8);
      return JSON.stringify({ width, height, borderRadius, borderWidth, transform });
    };
    const shapes = ['supreme', 'friendly', 'tournament', 'gost'].map(shapeOf);
    expect(new Set(shapes).size).toBe(4);
    // supreme larger than friendly; tournament rotated square; unknown hollow ring
    const style = (id) => markerStyle(categoryShape(id), categoryColor(id, tokens), 8);
    expect(style('supreme').width).toBeGreaterThan(style('elite').width);
    expect(style('friendly').width).toBeLessThan(style('elite').width);
    expect(style('tournament').transform).toEqual([{ rotate: '45deg' }]);
    expect(style('tournament').borderRadius).toBeLessThan(style('elite').borderRadius);
    expect(style('gost').borderWidth).toBeGreaterThan(0);
    expect(style('gost').backgroundColor).toBe('transparent');
    expect(style('elite').borderWidth).toBe(0);
    // colours are Stage tokens, unknown never reuses a tier colour
    expect(style('supreme').backgroundColor).toBe(tokens.cyan);
    expect(style('gost').borderColor).toBe(tokens.borderStrong);
  });

  test('CategoryDot renders the marker inside a fixed box so rows stay aligned', () => {
    const tree = render(<CategoryDot color="red" shape="diamond" />).toJSON();
    const box = StyleSheet.flatten(tree.props.style);
    expect(box.width).toBe(box.height);
    const inner = StyleSheet.flatten(tree.children[0].props.style);
    expect(inner.transform).toEqual([{ rotate: '45deg' }]);
    expect(inner.backgroundColor).toBe('red');
  });

  test('api calendar uses one marker for day cell, event row and legend', async () => {
    const { stageClient } = require('../../api/stageClient');
    const events = ['tournament', 'gost', 'friendly'].map((category, i) => ({
      id: `e${i}`, matchId: `e${i}`, category, homeName: `Home${i}`, awayName: `Away${i}`, startsAt: new Date().toISOString(), match: { id: `e${i}` },
    }));
    stageClient.http.get.mockResolvedValue({ timezone: 'Europe/Brussels', events });
    const { findByText, getAllByText, UNSAFE_getAllByType, toJSON } = render(<Calendar useApi onOpenMatch={jest.fn()} />);
    await findByText('Home0 v Away0');
    ['Supreme', 'Elite', 'Challenger', 'Regional', 'Friendly', 'Tournament'].forEach((label) => {
      expect(getAllByText(label).length).toBeGreaterThan(0);
    });
    expect(getAllByText('Other').length).toBe(1);
    const flat = UNSAFE_getAllByType(View).map((node) => StyleSheet.flatten(node.props.style) || {});
    const rotated = flat.filter((st) => Array.isArray(st.transform) && st.transform[0]?.rotate === '45deg');
    const rings = flat.filter((st) => st.borderWidth === 1.5 && st.backgroundColor === 'transparent');
    // tournament: day-cell dot + event row + legend; unknown: day-cell dot + event row + legend "Other"
    expect(rotated.length).toBeGreaterThanOrEqual(3);
    expect(rings.length).toBeGreaterThanOrEqual(3);
    expect(strayHex(toJSON)).toEqual([]);
  });

  test('hub card labels carry status and result for screen readers', () => {
    const event = {
      id: 'm1',
      homeName: 'Night Owls',
      awayName: 'Red Foxes',
      date: '2026-11-02T21:00:00Z',
      status: 'completed',
      competition: 'League',
      opposition: 'Red Foxes',
      venue: 'Home',
      matchData: { id: 'm1', home_score: 3, away_score: 1 },
    };
    const chip = render(<GameDayFixtureChip event={event} onPress={jest.fn()} myClub={null} />);
    const chipLabel = chip.getByRole('button').props.accessibilityLabel;
    expect(chipLabel).toMatch(/^Night Owls versus Red Foxes, /);
    expect(chipLabel).toContain('FT');
    expect(chipLabel).toContain('3 - 1');
    chip.unmount();

    const card = render(<GameDayMatchCard event={{ ...event, status: 'in_progress' }} onPress={jest.fn()} />);
    const cardLabel = card.getByRole('button').props.accessibilityLabel;
    expect(cardLabel).toMatch(/^Night Owls versus Red Foxes, /);
    expect(cardLabel).toContain('Live');
    expect(cardLabel).toContain('League');
    expect(cardLabel).toContain('3 - 1');
    card.unmount();

    const scheduled = render(<GameDayMatchCard event={{ ...event, status: 'scheduled' }} onPress={jest.fn()} />);
    const scheduledLabel = scheduled.getByRole('button').props.accessibilityLabel;
    expect(scheduledLabel).toContain('Scheduled');
    expect(scheduledLabel).not.toMatch(/\d - \d/);
    scheduled.unmount();

    const row = render(<ScheduleMatchRow event={{ ...event, result: { outcome: 'W', display: '3-1' } }} onPress={jest.fn()} />);
    const rowLabel = row.getByRole('button').props.accessibilityLabel;
    expect(rowLabel).toMatch(/^Red Foxes, League, /);
    expect(rowLabel).toContain('Result 3-1');
    row.unmount();

    const open = render(<ScheduleMatchRow event={{ ...event, status: 'scheduled' }} onPress={jest.fn()} />);
    expect(open.getByRole('button').props.accessibilityLabel).toContain('Scheduled');
  });

  test('fixtureAccessibilityLabel drops empty parts', () => {
    expect(fixtureAccessibilityLabel({ title: 'A versus B', parts: [null, 'Live', '', undefined, '1 - 0'] })).toBe('A versus B, Live, 1 - 0');
  });

  test('result sheet G/A/R inputs are 44pt touch targets', async () => {
    mockPlayerFilter.mockResolvedValue([{ id: 'p9', gamertag: 'Kaze' }]);
    const { findByText, UNSAFE_getAllByType } = render(
      <GameDayResultSheet
        visible
        onClose={jest.fn()}
        game={{ id: 'm1', status: 'in_progress', mode: 'club', home_club_id: 'c1', away_club_id: 'c2', home_club_name: 'Night Owls', away_club_name: 'Red Foxes', result_state: 'AWAITING_RESULT' }}
        myClub={{ id: 'c1' }}
        myPlayer={{ id: 'p1' }}
        isHomeTeam
        onSubmitted={jest.fn()}
      />,
    );
    fireEvent.press(await findByText('Kaze'));
    await waitFor(() => {
      const minis = UNSAFE_getAllByType(TextInput).filter((node) => node.props.keyboardType === 'decimal-pad');
      expect(minis).toHaveLength(3);
      minis.forEach((node) => {
        expect(StyleSheet.flatten(node.props.style).minHeight).toBeGreaterThanOrEqual(44);
      });
    });
  });

  test('match detail cards render with Stage tokens only', async () => {
    const game = { id: 'm1', status: 'scheduled', wager_stc: 1000, wager_status: 'pending_acceptance', home_club_name: 'Night Owls', away_club_name: 'Red Foxes', home_stream_url: 'https://twitch.tv/x' };
    const wager = render(<GameDayWagerCard game={game} isMyMatch amIHomeTeam={false} onGameUpdate={jest.fn()} />);
    expect(wager.getByText('STC WAGER')).toBeTruthy();
    expect(wager.getByText('Decline')).toBeTruthy();
    expect(strayHex(wager.toJSON)).toEqual([]);
    wager.unmount();

    const stream = render(<GameDayStreamCard game={game} isMyMatch amIHomeTeam isCompleted={false} onGameUpdate={jest.fn()} />);
    expect(stream.getByText('Home · Watch stream')).toBeTruthy();
    fireEvent.press(stream.getByText('Edit my stream'));
    expect(stream.getByPlaceholderText('https://twitch.tv/...')).toBeTruthy();
    expect(strayHex(stream.toJSON)).toEqual([]);
    stream.unmount();

    const fixture = render(<GameDayFixtureActions game={game} isMyMatch={false} onGameUpdate={jest.fn()} />);
    expect(fixture.toJSON()).toBeNull();
    fixture.unmount();

    const { stageClient } = require('../../api/stageClient');
    stageClient.http.get.mockImplementation((url) => Promise.resolve(
      url.includes('/history')
        ? { total: 0, homeWins: 0, draws: 0, awayWins: 0, meetings: [] }
        : { items: [], total: 0 },
    ));
    const insights = render(<GameDayInsights game={game} />);
    expect(insights.getByText('Head-to-Head')).toBeTruthy();
    expect(await insights.findByText('First meeting between these participants.')).toBeTruthy();
    expect(await insights.findByText('No published screenshots for this match.')).toBeTruthy();
    expect(strayHex(insights.toJSON)).toEqual([]);
  });

  test('head-to-head bar renders only non-empty segments (no phantom gap)', async () => {
    const { stageClient } = require('../../api/stageClient');
    const bar = async (history) => {
      stageClient.http.get.mockImplementation((url) => Promise.resolve(
        url.includes('/history') ? { meetings: [], ...history } : { items: [], total: 0 },
      ));
      const r = render(<GameDayInsights game={{ id: 'm1', home_club_name: 'Night Owls', away_club_name: 'Red Foxes' }} />);
      await r.findByText('Previous');
      const track = r.UNSAFE_root.findAll((node) => typeof node.type === 'string').find((node) => {
        const st = StyleSheet.flatten(node.props.style) || {};
        return st.height === 6 && st.gap === 4 && st.flexDirection === 'row';
      });
      const segments = track.children.map((c) => StyleSheet.flatten(c.props.style));
      r.unmount();
      return segments;
    };
    const oneSided = await bar({ total: 3, homeWins: 3, draws: 0, awayWins: 0 });
    expect(oneSided).toHaveLength(1);
    expect(oneSided[0].flex).toBe(1);
    const mixed = await bar({ total: 4, homeWins: 2, draws: 1, awayWins: 1 });
    expect(mixed).toHaveLength(3);
    expect(mixed.map((s) => s.flex)).toEqual([0.5, 0.25, 0.25]);
    const noDraws = await bar({ total: 2, homeWins: 1, draws: 0, awayWins: 1 });
    expect(noDraws).toHaveLength(2);
  });
});
