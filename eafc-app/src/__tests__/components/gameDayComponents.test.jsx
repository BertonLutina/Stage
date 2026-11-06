import React from 'react';
import { StyleSheet, Image } from 'react-native';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import useThemeStore from '../../store/themeStore';

const mockPush = jest.fn();
const mockPlayerFilter = jest.fn();
const mockBackgroundFilter = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: (...a) => mockPush(...a) }),
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
jest.mock('../../lib/accountMode', () => ({ readAccountMode: () => 'player' }));
jest.mock('../../api/stageClient', () => ({
  stageClient: {
    auth: { me: () => Promise.resolve({}) },
    entities: {
      Player: { filter: (...a) => mockPlayerFilter(...a), list: () => Promise.resolve([]) },
      Club: { list: () => Promise.resolve([]) },
      ClubFixtureLineup: { filter: () => Promise.resolve([]) },
      PlayerCardBackground: { filter: (...a) => mockBackgroundFilter(...a) },
    },
    http: { get: jest.fn(() => Promise.resolve({ applicable: false })), patch: jest.fn() },
    integrations: { Core: { UploadFile: jest.fn() } },
  },
  resolveMyPlayerAndClub: jest.fn(() => Promise.resolve({ player: null })),
}));

const GameDayKickoffActions = require('../../components/matches/GameDayKickoffActions').default;
const GameDayKickoffArena = require('../../components/matches/GameDayKickoffArena').default;
const GameDayScoreReport = require('../../components/matches/GameDayScoreReport').default;
const GameDayResultSheet = require('../../components/matches/GameDayResultSheet').default;
const GameDayTileBackgroundDialog = require('../../components/matches/GameDayTileBackgroundDialog').default;
const ArrangeGameModal = require('../../components/matches/ArrangeGameModal').default;
const DateTimeZoneFields = require('../../components/matches/DateTimeZoneFields').default;
const { GameDayFixtureChip, GameDayMatchCard, ScheduleMatchRow } = require('../../components/matches/MatchHubCards');
const ScheduleFixturesList = require('../../components/schedule/ScheduleFixturesList').default;
const ScheduleCalendar = require('../../components/schedule/ScheduleCalendar').default;
const PageTile = require('../../components/theme/PageTile').default;

const HEX = /#[0-9A-Fa-f]{6}\b/;

/** Colours that reach the rendered tree must be Stage token values, never stray hex. */
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

const plusPlayer = {
  id: 'p1',
  gamertag: 'NightOwl',
  stc: 5000,
  subscription: 'stage_plus',
  subscription_expires_at: '2099-01-01T00:00:00Z',
  game_day_tile_backgrounds: {
    home: { type: 'custom', url: 'https://cdn.example/home.jpg', position: '50% 50%', zoom: 120 },
  },
};

const baseEvent = {
  id: 'm1',
  homeName: 'Night Owls',
  awayName: 'Red Foxes',
  date: '2026-11-02T21:00:00Z',
  status: 'scheduled',
  competition: 'League',
  opposition: 'Red Foxes',
  venue: 'Home',
  isMyClub: true,
  hasStream: true,
  matchData: { id: 'm1', home_score: 2, away_score: 1 },
};

beforeEach(() => {
  jest.clearAllMocks();
  mockPlayerFilter.mockResolvedValue([]);
  mockBackgroundFilter.mockResolvedValue([{ id: 'b1', name: 'Floodlights', image_url: 'https://cdn.example/b1.jpg' }]);
  const store = {};
  global.localStorage = {
    getItem: (key) => (Object.prototype.hasOwnProperty.call(store, key) ? store[key] : null),
    setItem: (key, value) => { store[String(key)] = String(value); },
    removeItem: (key) => { delete store[String(key)]; },
  };
});

describe.each(['theme-dark', 'theme-video'])('Game Day components in %s', (theme) => {
  beforeEach(() => useThemeStore.getState().setStageTheme(theme));

  test('kickoff actions: KICK OFF fires, is inert when not allowed, and keeps both notices', () => {
    const onKickoff = jest.fn();
    const { getByLabelText, getByText, rerender, toJSON } = render(
      <GameDayKickoffActions controls={{ showHomeKickoff: true, canPressKickoff: true }} loading={false} onKickoff={onKickoff} />,
    );
    fireEvent.press(getByLabelText('KICK OFF'));
    expect(onKickoff).toHaveBeenCalledTimes(1);
    expect(strayHex(toJSON)).toEqual([]);

    rerender(
      <GameDayKickoffActions controls={{ showHomeKickoff: true, canPressKickoff: false, tooEarly: true }} loading={false} onKickoff={onKickoff} />,
    );
    expect(getByText('Kickoff available 15 minutes before match time.')).toBeTruthy();
    fireEvent.press(getByLabelText('KICK OFF'));
    expect(onKickoff).toHaveBeenCalledTimes(1);

    rerender(<GameDayKickoffActions controls={{ showAwayWaiting: true }} />);
    expect(getByText('Waiting for home team to kick off.')).toBeTruthy();

    rerender(<GameDayKickoffActions controls={{}} />);
    expect(toJSON()).toBeNull();
  });

  test('kickoff arena: names, live score, "you" marker and the tile menu', () => {
    const onChangeBackground = jest.fn();
    const onPress = jest.fn();
    const { getByText, getByLabelText, toJSON } = render(
      <GameDayKickoffArena
        homeName="Night Owls"
        awayName="Red Foxes"
        homeYou
        date="2026-11-02T21:00:00Z"
        status="in_progress"
        statusLabel="Live"
        competitionLabel="League"
        homeScore={2}
        awayScore={1}
        wagerStc={1000}
        wagerLocked
        backgroundConfig={{ type: 'custom', url: 'https://cdn.example/x.jpg', position: '50% 50%', zoom: 120 }}
        onChangeBackground={onChangeBackground}
        onPress={onPress}
      />,
    );
    expect(getByText('Night Owls')).toBeTruthy();
    expect(getByText('Red Foxes')).toBeTruthy();
    expect(getByText('LIVE')).toBeTruthy();
    fireEvent.press(getByLabelText('Change Match Details background'));
    expect(onChangeBackground).toHaveBeenCalled();
    fireEvent.press(getByText('Night Owls'));
    expect(onPress).toHaveBeenCalled();
    expect(strayHex(toJSON)).toEqual([]);
  });

  test('score report: submit CTA opens the result form and stays hidden for other clubs', () => {
    const onSubmitPress = jest.fn();
    const props = {
      game: { id: 'm1', status: 'in_progress', result_state: 'AWAITING_RESULT' },
      homeName: 'Night Owls',
      awayName: 'Red Foxes',
      amIHomeTeam: true,
      isLive: true,
      isCompleted: false,
      isDisputed: false,
      showResultForm: false,
      onSubmitPress,
    };
    const { getByLabelText, getByText, queryByText, rerender, toJSON } = render(
      <GameDayScoreReport {...props} isMyMatch />,
    );
    expect(getByText('MATCH SCORE')).toBeTruthy();
    expect(getAllClaims(getByText)).toBeTruthy();
    fireEvent.press(getByLabelText('SUBMIT FULL TIME'));
    expect(onSubmitPress).toHaveBeenCalled();
    expect(strayHex(toJSON)).toEqual([]);
    rerender(<GameDayScoreReport {...props} isMyMatch={false} />);
    expect(queryByText('MATCH SCORE')).toBeNull();
  });

  test('result sheet: submit mode keeps its form, requires proof before submitting', async () => {
    const onClose = jest.fn();
    const { getByText, getByLabelText, toJSON } = render(
      <GameDayResultSheet
        visible
        onClose={onClose}
        game={{ id: 'm1', status: 'in_progress', home_club_name: 'Night Owls', away_club_name: 'Red Foxes', result_state: 'AWAITING_RESULT' }}
        myClub={{ id: 'c1' }}
        myPlayer={plusPlayer}
        isHomeTeam
        onSubmitted={jest.fn()}
      />,
    );
    expect(getByText('SUBMIT RESULT')).toBeTruthy();
    expect(getByText('Night Owls (home)')).toBeTruthy();
    expect(getByText('Gallery')).toBeTruthy();
    expect(getByText('Camera')).toBeTruthy();
    fireEvent.press(getByLabelText('Close'));
    expect(onClose).toHaveBeenCalled();
    await waitFor(() => expect(strayHex(toJSON)).toEqual([]));
  });

  test('tile background dialog: gated without STAGE Plus, lists designs with it', async () => {
    const onClose = jest.fn();
    const gated = render(
      <GameDayTileBackgroundDialog visible onClose={onClose} player={{ id: 'p1' }} tileKey="home" tileTitle="Home" canCustomize={false} />,
    );
    expect(gated.getByText('STAGE Plus required')).toBeTruthy();
    fireEvent.press(gated.getByLabelText('View STAGE Plus'));
    expect(mockPush).toHaveBeenCalledWith('/apps/store');
    gated.unmount();

    const open = render(
      <GameDayTileBackgroundDialog visible onClose={onClose} player={plusPlayer} tileKey="home" tileTitle="Home" canCustomize onPlayerChanged={jest.fn()} />,
    );
    expect(await open.findByText('Floodlights')).toBeTruthy();
    expect(open.getByText('Choose image')).toBeTruthy();
    expect(open.getByText('Official Stage+ designs')).toBeTruthy();
    expect(strayHex(open.toJSON)).toEqual([]);
  });

  test('arrange game: player/club switch changes the search placeholder; Continue stays gated', async () => {
    const { getByLabelText, getByPlaceholderText, getByText } = render(
      <ArrangeGameModal visible onClose={jest.fn()} myPlayer={plusPlayer} myClub={{ id: 'c1', name: 'Night Owls', stc: 1000 }} onSent={jest.fn()} />,
    );
    expect(getByText('ARRANGE VS FIXTURE')).toBeTruthy();
    expect(getByPlaceholderText('Search players...')).toBeTruthy();
    fireEvent.press(getByLabelText('CLUB VS'));
    expect(getByPlaceholderText('Search clubs...')).toBeTruthy();
    fireEvent.press(getByLabelText('PLAYER VS'));
    expect(getByPlaceholderText('Search players...')).toBeTruthy();
  });

  test('arrange game: details step with a preset opponent gates Continue until a date and time exist', () => {
    const { getByLabelText, getByText } = render(
      <ArrangeGameModal
        visible
        onClose={jest.fn()}
        myPlayer={plusPlayer}
        myClub={null}
        presetOpponent={{ id: 'p2', gamertag: 'Rival', name: 'Rival' }}
        presetKind="player"
        onSent={jest.fn()}
      />,
    );
    expect(getByText('Pick a date')).toBeTruthy();
    expect(getByLabelText('Continue').props.accessibilityState.disabled).toBe(true);
  });

  test('date, time and timezone fields: timezone chips report the picked zone', () => {
    const onTimezoneChange = jest.fn();
    const { getByText } = render(
      <DateTimeZoneFields date="" time="" timezone="Europe/Brussels" onDateChange={jest.fn()} onTimeChange={jest.fn()} onTimezoneChange={onTimezoneChange} />,
    );
    expect(getByText('Pick a date')).toBeTruthy();
    expect(getByText('Pick a time')).toBeTruthy();
    const { TIMEZONES } = require('../../lib/timezones');
    const other = TIMEZONES.find((zone) => zone.value !== 'Europe/Brussels');
    fireEvent.press(getByText(other.label));
    expect(onTimezoneChange).toHaveBeenCalledWith(other.value);
  });

  test('hub cards: fixture chip selects, match card and result row open', () => {
    const onPress = jest.fn();
    const chip = render(<GameDayFixtureChip event={baseEvent} selected onPress={onPress} myClub={null} />);
    fireEvent.press(chip.getByLabelText(/^Night Owls versus Red Foxes, /));
    expect(onPress).toHaveBeenCalled();
    expect(chip.getByText('Your Club')).toBeTruthy();
    expect(strayHex(chip.toJSON)).toEqual([]);
    chip.unmount();

    const card = render(<GameDayMatchCard event={{ ...baseEvent, status: 'in_progress' }} onPress={onPress} />);
    expect(card.getByText('Live')).toBeTruthy();
    expect(card.getByText('2 - 1')).toBeTruthy();
    expect(card.getByText('Live Stream')).toBeTruthy();
    expect(strayHex(card.toJSON)).toEqual([]);
    card.unmount();

    const row = render(
      <ScheduleMatchRow event={{ ...baseEvent, status: 'completed', result: { outcome: 'L', display: '1-2' } }} onPress={onPress} />,
    );
    fireEvent.press(row.getByLabelText(/^Red Foxes, League, /));
    expect(onPress).toHaveBeenCalledTimes(2);
    expect(row.getByText('1-2')).toBeTruthy();
    expect(strayHex(row.toJSON)).toEqual([]);
  });

  test('fixtures list: matches open, contract rows render, empty copy stays', () => {
    const onOpenMatch = jest.fn();
    const empty = render(<ScheduleFixturesList events={[]} onOpenMatch={onOpenMatch} />);
    expect(empty.getByText('No scheduled matches yet')).toBeTruthy();
    empty.unmount();

    const events = [
      { id: 'a', type: 'match', date: '2026-11-02T21:00:00Z', opposition: 'Red Foxes', venue: 'Home', competition: 'League', status: 'scheduled' },
      { id: 'b', type: 'contract_end', date: '2026-11-06T12:00:00Z', contractData: { contract_type: 'player' } },
    ];
    const list = render(<ScheduleFixturesList events={events} onOpenMatch={onOpenMatch} />);
    expect(list.getByText('Red Foxes')).toBeTruthy();
    expect(list.getByText('Contract End · player')).toBeTruthy();
    fireEvent.press(list.getByText('Red Foxes'));
    expect(onOpenMatch).toHaveBeenCalledWith(expect.objectContaining({ id: 'a' }));
    expect(strayHex(list.toJSON)).toEqual([]);
  });

  test('legacy calendar: month navigation and day sheet keep working', () => {
    const today = new Date();
    const events = [{ id: 'ev1', type: 'match', date: today.toISOString(), opposition: 'Red Foxes', competition: 'League', venue: 'Home', status: 'scheduled' }];
    const onOpenMatch = jest.fn();
    const { getByLabelText, getAllByText, queryByText, toJSON } = render(
      <ScheduleCalendar useApi={false} events={events} onOpenMatch={onOpenMatch} />,
    );
    fireEvent.press(getByLabelText('Next month'));
    fireEvent.press(getByLabelText('Previous month'));
    // the grid repeats day numbers from neighbouring months: press until today's cell opens the sheet
    const cells = getAllByText(String(today.getDate()));
    for (let i = 0; i < cells.length && !queryByText('Red Foxes'); i += 1) fireEvent.press(cells[i]);
    fireEvent.press(queryByText('Red Foxes'));
    expect(onOpenMatch).toHaveBeenCalledWith(expect.objectContaining({ id: 'ev1' }));
    expect(strayHex(toJSON)).toEqual([]);
  });

  test('api calendar: scope chips, today button and a day with games', async () => {
    const { stageClient } = require('../../api/stageClient');
    const now = new Date();
    stageClient.http.get.mockResolvedValue({
      timezone: 'Europe/Brussels',
      events: [{
        id: 'ev1', matchId: 'ev1', category: 'elite', homeName: 'Night Owls', awayName: 'Red Foxes', startsAt: now.toISOString(), score: null, match: { id: 'ev1' },
      }],
    });
    const onOpenMatch = jest.fn();
    const { findByText, getByText, getByLabelText, toJSON } = render(
      <ScheduleCalendar useApi onOpenMatch={onOpenMatch} />,
    );
    expect(await findByText('Night Owls v Red Foxes')).toBeTruthy();
    fireEvent.press(getByText('GOST'));
    await waitFor(() => expect(stageClient.http.get).toHaveBeenCalledWith('/schedule/calendar', expect.objectContaining({ scope: 'gost' })));
    fireEvent.press(getByLabelText('Today'));
    expect(strayHex(toJSON)).toEqual([]);
  });

  test('PageTile keeps the STAGE Plus photo background and the background menu', async () => {
    const { getByLabelText, getByText, UNSAFE_getAllByType, toJSON } = render(
      <PageTile tileKey="home" tileTitle="HOME" eyebrow="HOME" player={plusPlayer}>
        <Text>tile body</Text>
      </PageTile>,
    );
    expect(getByText('tile body')).toBeTruthy();
    expect(getByText('HOME')).toBeTruthy();
    expect(UNSAFE_getAllByType(Image).some((node) => node.props.source?.uri === 'https://cdn.example/home.jpg')).toBe(true);
    fireEvent.press(getByLabelText('Change HOME background'));
    expect(await waitFor(() => getByText('HOME background'))).toBeTruthy();
    expect(strayHex(toJSON)).toEqual([]);
  });

  test('PageTile without STAGE Plus has no photo and radius 16 chrome', () => {
    const { UNSAFE_queryAllByType, toJSON } = render(
      <PageTile tileKey="home" tileTitle="HOME" player={{ id: 'p1' }}>
        <Text>tile body</Text>
      </PageTile>,
    );
    expect(UNSAFE_queryAllByType(Image)).toHaveLength(0);
    const first = toJSON();
    const flat = StyleSheet.flatten((Array.isArray(first) ? first[0] : first).props.style);
    expect(flat.borderRadius).toBe(16);
    // a tile without a photo keeps the card fill (an explicit undefined would make it transparent)
    expect(flat.backgroundColor).toBe(useThemeStore.getState().tokens.card);
    expect(flat.borderColor).toBe(useThemeStore.getState().tokens.border);
  });
});

function Text({ children }) {
  const { Text: RNText } = require('react-native');
  return <RNText>{children}</RNText>;
}

function getAllClaims(getByText) {
  return getByText('NIGHT OWLS · HOME') && getByText('RED FOXES · AWAY');
}
