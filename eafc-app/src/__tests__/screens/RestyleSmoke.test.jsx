/**
 * Restyle smoke test (Task 17a).
 *
 * Renders every route screen under src/app/** and every exported component under the restyled
 * component folders, in BOTH Stage themes (theme-dark and theme-video / Live Dark), and asserts
 * nothing throws. Static checks (hex/emoji) cannot catch runtime defects such as a helper whose
 * signature gained a required prop, or an unreachable identifier; rendering does.
 *
 * Network / native modules are mocked below. Components that need data are fed fixtures from
 * FIXTURES (including optional branches: loans with purchase_type OPTIONAL/MANDATORY, empty lists,
 * error states). Anything that cannot render under jest is listed in SKIPPED with the reason.
 */
import React from 'react';
import fs from 'fs';
import path from 'path';
import { render, act } from '@testing-library/react-native';
import useThemeStore from '../../store/themeStore';
import useAuthStore from '../../store/authStore';

jest.setTimeout(120000);

let mockParams = {};
const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
  navigate: jest.fn(),
  setParams: jest.fn(),
  canGoBack: () => true,
};

jest.mock('expo-router', () => {
  const React = require('react');
  const { View } = require('react-native');
  const passthrough = ({ children }) => React.createElement(View, null, children);
  const Stack = Object.assign(passthrough, { Screen: () => null });
  const Tabs = Object.assign(passthrough, { Screen: () => null });
  return {
    useRouter: () => mockRouter,
    router: mockRouter,
    useLocalSearchParams: () => mockParams,
    useGlobalSearchParams: () => mockParams,
    usePathname: () => '/',
    useSegments: () => [],
    useNavigation: () => ({ navigate: jest.fn(), goBack: jest.fn(), setOptions: jest.fn(), addListener: () => () => {} }),
    useFocusEffect: (cb) => {
      React.useEffect(() => {
        const cleanup = cb();
        return typeof cleanup === 'function' ? cleanup : undefined;
      }, []); // eslint-disable-line react-hooks/exhaustive-deps
    },
    Stack,
    Tabs,
    Slot: passthrough,
    Redirect: () => null,
    Link: ({ children }) => React.createElement(View, null, children),
    ThemeProvider: passthrough,
    DarkTheme: {},
  };
});
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
jest.mock('@expo/vector-icons/Ionicons', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return { __esModule: true, default: ({ name, ...rest }) => React.createElement(Text, rest, name) };
});
jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { Text } = require('react-native');
  const Icon = ({ name, ...rest }) => React.createElement(Text, rest, name);
  return { Ionicons: Icon, MaterialIcons: Icon, MaterialCommunityIcons: Icon, Feather: Icon, FontAwesome: Icon };
});
jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'denied' })),
  launchImageLibraryAsync: jest.fn(() => Promise.resolve({ canceled: true })),
  MediaTypeOptions: { Images: 'Images', Videos: 'Videos', All: 'All' },
}));
jest.mock('../../../global.css', () => ({}), { virtual: true });
jest.mock('expo-status-bar', () => ({ StatusBar: () => null }));
jest.mock('expo-splash-screen', () => ({
  preventAutoHideAsync: jest.fn(() => Promise.resolve()),
  hideAsync: jest.fn(() => Promise.resolve()),
  setOptions: jest.fn(),
}));
jest.mock('@react-native-async-storage/async-storage', () => {
  const storage = {
    getItem: jest.fn(() => Promise.resolve(null)),
    setItem: jest.fn(() => Promise.resolve()),
    removeItem: jest.fn(() => Promise.resolve()),
  };
  return { __esModule: true, default: storage, ...storage };
});
jest.mock('expo-font', () => ({ useFonts: () => [true, null], loadAsync: jest.fn() }));
jest.mock('expo-web-browser', () => ({ openBrowserAsync: jest.fn(), maybeCompleteAuthSession: jest.fn(), openAuthSessionAsync: jest.fn() }));
jest.mock('expo-auth-session', () => ({ makeRedirectUri: () => 'app://redirect' }));
jest.mock('expo-local-authentication', () => ({
  hasHardwareAsync: jest.fn(() => Promise.resolve(false)),
  isEnrolledAsync: jest.fn(() => Promise.resolve(false)),
  authenticateAsync: jest.fn(() => Promise.resolve({ success: false })),
  supportedAuthenticationTypesAsync: jest.fn(() => Promise.resolve([])),
}));
jest.mock('@react-navigation/native-stack', () => ({ createNativeStackNavigator: () => ({ Navigator: () => null, Screen: () => null }) }));
jest.mock('@react-navigation/bottom-tabs', () => ({ createBottomTabNavigator: () => ({ Navigator: () => null, Screen: () => null }) }));
jest.mock('react-native-screens', () => {
  const React = require('react');
  const { View } = require('react-native');
  return { FullWindowOverlay: ({ children }) => React.createElement(View, null, children), enableScreens: jest.fn() };
});

// Legacy axios client (feature screens): never touch the network.
jest.mock('../../utils/api', () => {
  const ok = () => Promise.resolve({ data: { data: [], items: [] } });
  const api = { get: ok, post: ok, put: ok, patch: ok, delete: ok, defaults: { baseURL: 'http://localhost' }, interceptors: { request: { use: () => {} }, response: { use: () => {} } } };
  return { __esModule: true, default: api, SOCKET_URL: 'http://localhost', API_BASE_URL: 'http://localhost' };
});

// Tournament REST helpers: serve one tournament whose status the test can switch.
let mockTournamentStatus = 'registration_open';
jest.mock('../../api/tournamentActions', () => {
  const tournament = () => ({
    id: 't1', name: 'Autumn Cup', type: 'knockout', status: mockTournamentStatus, max_teams: 16,
    entry_fee_stc: 100000, prize_pool_stc: 1600000, registered_clubs: [{ id: 'c1', name: 'Night Owls FC' }],
    start_date: '2031-01-01T10:00:00Z',
  });
  const matches = [
    { id: 'a', round: 1, status: 'completed', home_club_id: 'c1', away_club_id: 'c2', home_club_name: 'Night Owls', away_club_name: 'Red Foxes', home_score: 1, away_score: 0 },
    { id: 'b', round: 2, status: 'scheduled', home_club_id: 'c1', away_club_id: 'c2', home_club_name: 'Night Owls', away_club_name: 'Red Foxes' },
  ];
  const ok = () => jest.fn(() => Promise.resolve({}));
  return {
    __esModule: true,
    isPlayerTournament: () => false,
    fetchTournamentMatches: jest.fn(() => Promise.resolve(matches)),
    fetchTournamentPublic: jest.fn(() => Promise.resolve(tournament())),
    acceptTournamentRules: ok(), registerTournamentClub: ok(), registerTournamentPlayer: ok(), notifyTournamentRegistration: ok(),
    generateTournamentDraw: ok(), clearTournamentDraw: ok(), initializeTournamentDraw: ok(), withdrawTournamentClub: ok(),
    cancelTournamentById: ok(), deleteTournamentById: ok(), simulateTournamentScore: ok(), advanceTournamentRound: ok(),
    createTournamentFinalAndThirdPlace: ok(), officializeTournament: ok(),
  };
});

// Generic stage client: any entity / function / http call resolves to an empty list.
jest.mock('../../api/stageClient', () => {
  // Records are served for the few calls whose result shape drives optional render branches.
  const SERVED = {
    // PlayerLoan.get('loan-OPTIONAL' | 'loan-MANDATORY' | 'loan-NONE') -> loan with that purchase clause
    'entities.PlayerLoan.get': (id) => Promise.resolve({
      status: 'PROPOSED',
      purchase_type: String(id).split('-')[1],
      purchase_option_stc: 1500,
      loan_fee_stc: 100,
      parent_wage_percentage: 50,
      loan_wage_percentage: 50,
      start_date: '2026-01-01',
      end_date: '2026-06-01',
    }),
  };
  const makeDeep = (pathName = '') => new Proxy(function deepMock() {}, {
    get: (_target, prop) => {
      if (prop === 'then') return undefined;
      if (prop === Symbol.toPrimitive) return () => '';
      return makeDeep(pathName ? `${pathName}.${String(prop)}` : String(prop));
    },
    apply: (_target, _this, args) => (SERVED[pathName] ? SERVED[pathName](...args) : Promise.resolve([])),
  });
  const stageClient = makeDeep();
  return {
    __esModule: true,
    stageClient,
    base44: stageClient,
    resolveMyPlayerAndClub: jest.fn(() => Promise.resolve({ player: null, club: null, presidentClub: null, user: null })),
    userNeedsOnboarding: jest.fn(() => false),
    markNeedsOnboarding: jest.fn(),
    clearNeedsOnboarding: jest.fn(),
    peekOAuthEntranceMode: jest.fn(),
    clearOAuthReturnState: jest.fn(),
    consumeOAuthReturnPath: jest.fn(),
    storeTokens: jest.fn(() => Promise.resolve()),
    clearTokens: jest.fn(() => Promise.resolve()),
  };
});

const SRC = path.resolve(__dirname, '../..');

const THEMES = ['theme-dark', 'theme-video'];

const ME = {
  id: 'u1',
  email: 'night.owl@example.com',
  gamertag: 'NightOwl_10',
  player_id: 'p1',
  club_id: 'c1',
  roles: ['player'],
};

beforeAll(() => {
  // Screens under (tabs) are auth-gated: they assume a signed-in user.
  useAuthStore.setState({ user: ME, loading: false, error: null });
});

function useTheme(id) {
  const store = {};
  global.localStorage = {
    getItem: (key) => (Object.prototype.hasOwnProperty.call(store, key) ? store[key] : null),
    setItem: (key, value) => { store[String(key)] = String(value); },
    removeItem: (key) => { delete store[String(key)]; },
  };
  useThemeStore.getState().setStageTheme(id);
}

function listFiles(dir, out = []) {
  fs.readdirSync(dir, { withFileTypes: true }).forEach((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) listFiles(full, out);
    else if (/\.jsx?$/.test(entry.name)) out.push(full);
  });
  return out;
}

const rel = (file) => path.relative(SRC, file);

// React dev warnings that point at real defects (not mere noise): collected per render and asserted.
const FATAL_WARNINGS = /missing an accessibilityLabel|Encountered two children with the same key|Maximum update depth|Cannot update a component|Rendered (more|fewer) hooks|is not a function|Each child in a list should have a unique "key"/;

// Keys (route screen file, or `<component file>#<export>`) that legitimately render nothing under jest.
const RENDERS_NULL_OK = new Set([
  // Redirect-only routes render nothing by design.
  'app/auth/registerscreen.jsx',
  'app/index.jsx',
  // State switch with no children and no flags renders nothing by design.
  'components/ui/ResourceState.jsx#default',
  'components/ui/index.js#ResourceState',
]);

async function renderChecked(label, element, { expectContent = false } = {}) {
  const seen = [];
  let rendered;
  const spy = jest.spyOn(console, 'error').mockImplementation((...args) => {
    const text = args.map((a) => (typeof a === 'string' ? a : String(a && a.message ? a.message : a))).join(' ');
    if (FATAL_WARNINGS.test(text)) seen.push(text.slice(0, 300));
  });
  let tree;
  try {
    tree = render(element);
    await act(async () => {
      await Promise.resolve();
    });
    rendered = tree.toJSON();
  } finally {
    // Always unmount, even when rendering or the act flush threw, so one failure cannot leak into the next case.
    if (tree) tree.unmount();
    spy.mockRestore();
  }
  if (seen.length) throw new Error(`${label}: ${seen[0]}`);
  if (expectContent && !RENDERS_NULL_OK.has(label) && rendered == null) {
    throw new Error(`${label}: rendered nothing (null) - a crash that is swallowed into an empty screen?`);
  }
}

function isComponentExport(name, value) {
  if (!/^[A-Z]/.test(name)) return false;
  if (typeof value === 'function') return true;
  return Boolean(value && typeof value === 'object' && value.$$typeof);
}

describe('restyle smoke: route screens', () => {
  const screenFiles = listFiles(path.join(SRC, 'app')).sort();
  THEMES.forEach((themeId) => {
    screenFiles.forEach((file) => {
      const name = rel(file);
      test(`${name} renders in ${themeId}`, async () => {
        useTheme(themeId);
        // eslint-disable-next-line global-require, import/no-dynamic-require
        const mod = require(file);
        const Screen = mod.default;
        expect(typeof Screen === 'function' || (Screen && Screen.$$typeof)).toBeTruthy();
        const paramVariants = SCREEN_PARAMS[name] || [{}];
        const statuses = STATUS_SCREENS.has(name) ? TOURNAMENT_STATUSES.map((t) => t.status) : [null];
        for (const params of paramVariants) {
          for (const status of statuses) {
            mockParams = params;
            if (status) mockTournamentStatus = status;
            // eslint-disable-next-line no-await-in-loop
            await renderChecked(name, React.createElement(Screen, SCREEN_PROPS[name] || {}), { expectContent: true });
          }
        }
        mockTournamentStatus = 'registration_open';
      });
    });
  });
});

const SCREEN_PROPS = {};

describe('restyle smoke: harness sanity', () => {
  test('the mocked tournament API feeds the detail screen (the smoke renders real data branches)', async () => {
    useTheme('theme-dark');
    mockParams = { tournamentId: 't1' };
    const Detail = require('../../app/(tabs)/tournaments/tournamentdetailscreen').default;
    const { findByText } = render(React.createElement(Detail));
    expect(await findByText('Autumn Cup')).toBeTruthy();
  });

  test.each([['loan-OPTIONAL', 'Option to buy'], ['loan-MANDATORY', 'Obligation to buy']])(
    'the mocked stage client serves the loan branch for %s',
    async (loanId, label) => {
      useTheme('theme-video');
      const InboxLoanCard = require('../../components/inbox/InboxLoanCard').default;
      const { findByText } = render(
        React.createElement(InboxLoanCard, { message: { id: 'l1', message_type: 'loan_proposal', related_entity_id: loanId, metadata: '{}' } }),
      );
      expect(await findByText(new RegExp(`${label}:`))).toBeTruthy();
    },
  );

  test('no source file uses StyleSheet.absoluteFillObject (removed in RN 0.86, it is undefined at runtime)', () => {
    const { StyleSheet } = require('react-native');
    expect(StyleSheet.absoluteFillObject).toBeUndefined();
    const offenders = listFiles(SRC)
      .filter((file) => !file.includes(`${path.sep}__tests__${path.sep}`))
      .filter((file) => /StyleSheet\.absoluteFillObject/.test(fs.readFileSync(file, 'utf8')))
      .map(rel);
    expect(offenders).toEqual([]);
  });
});

// Route params so the data branches (not just the "nothing selected" state) render. Each entry is a list of variants.
const SCREEN_PARAMS = {
  'app/(tabs)/tournaments/tournamentdetailscreen.jsx': [{ tournamentId: 't1' }],
  'app/(tabs)/tournaments/fixturesscreen.jsx': [{ tournamentId: 't1' }],
  'app/(tabs)/tournaments/groupstagescreen.jsx': [{ tournamentId: 't1' }],
  'app/(tabs)/tournaments/bracketscreen.jsx': [{ tournamentId: 't1' }],
  'app/(tabs)/tournaments/leaguestandingsscreen.jsx': [{ tournamentId: 't1' }],
  'app/(tabs)/matches/matchdetailscreen.jsx': [{ matchId: 'm1' }, { id: 'm1' }],
  'app/(tabs)/matches/watchmatchscreen.jsx': [{ matchId: 'm1' }],
  'app/(tabs)/matches/uploadvideoscreen.jsx': [{ matchId: 'm1' }],
  'app/(tabs)/profile/profilescreen.jsx': [{ playerId: 'p1' }, { id: 'p9' }],
  'app/apps/inbox/[id].jsx': [{ id: 'm1' }],
  'app/apps/[slug].jsx': [{ slug: 'nothing-here' }, { slug: 'wallet' }],
  'app/apps/leagues/[slug].jsx': [{ slug: 'premier' }],
  'app/apps/competitions/[slug].jsx': [{ slug: 'premier' }],
  'app/apps/club/[id].jsx': [{ id: 'c1' }],
  'app/teams/teamprofilescreen.jsx': [{ teamId: 'c1' }, { id: 'c1' }],
};
// Tournament screens are additionally rendered for every tournament status.
const STATUS_SCREENS = new Set([
  'app/(tabs)/tournaments/tournamentdetailscreen.jsx',
  'app/(tabs)/tournaments/groupstagescreen.jsx',
  'app/(tabs)/tournaments/bracketscreen.jsx',
  'app/(tabs)/tournaments/leaguestandingsscreen.jsx',
]);

// ---------------------------------------------------------------------------------------------
// Components
// ---------------------------------------------------------------------------------------------
const COMPONENT_DIRS = [
  'ui', 'dashboard', 'matches', 'schedule', 'tournament', 'club', 'team', 'profile', 'inbox',
  'settings', 'directory', 'transfer', 'chat', 'onboarding', 'auth', 'theme', 'common', 'apps',
  'competitions', 'rankings',
];

const NOW_ISO = '2030-01-02T21:00:00Z';
const PLAYER = {
  id: 'p1', gamertag: 'NightOwl_10', gamer_tag: 'NightOwl_10', first_name: 'Night', last_name: 'Owl',
  position: 'ST', overall_rating: 84, avatar_url: null, role: 'player', platform: 'PlayStation',
  club_id: 'c1', shirt_number: 9,
};
const CLUB = { id: 'c1', name: 'Night Owls FC', tag: 'NOW', region: 'Europe', logo_url: null, platform: 'PlayStation' };
const LONG_NAME = 'A_Really_Long_Gamertag_Name_20_chars';
const noop = () => {};

const eventFor = (status, over = {}) => ({
  id: `m-${status}`,
  homeName: 'Night Owls',
  awayName: 'Red Foxes',
  date: NOW_ISO,
  status,
  competition: 'League',
  matchData: { id: 'm1', home_club_id: 'c1', away_club_id: 'c2', home_score: 2, away_score: 1 },
  result: { outcome: 'W' },
  ...over,
});
const EVENTS = ['scheduled', 'in_progress', 'completed', 'disputed', 'forfeit'].map((st) => eventFor(st));

const GAME = {
  id: 'm1', status: 'scheduled', home_club_id: 'c1', away_club_id: 'c2', home_club_name: 'Night Owls', away_club_name: 'Red Foxes',
  scheduled_date: NOW_ISO, home_score: null, away_score: null,
};
const GAME_STATUSES = ['scheduled', 'in_progress', 'completed', 'disputed', 'forfeit'].map((status) => ({ ...GAME, status, home_score: 2, away_score: 1 }));

const TOURNAMENT = {
  id: 't1', name: 'Autumn Cup', type: 'knockout', status: 'registration_open', max_teams: 16,
  entry_fee_stc: 100000, prize_pool_stc: 1600000, registered_clubs: [CLUB], start_date: '2031-01-01T10:00:00Z',
};
const TOURNAMENT_STATUSES = ['draft', 'registration_open', 'in_progress', 'completed', 'cancelled']
  .map((status) => ({ ...TOURNAMENT, status }));

const INBOX_MESSAGES = [
  { id: 'm1', subject: 'Contract offer', body: 'Red Foxes want to sign you.', message_type: 'contract_offer', status: 'pending', is_read: false, sender_gamertag: 'Red Foxes', created_date: new Date().toISOString() },
  { id: 'm2', subject: 'System', body: 'Welcome', message_type: 'info', is_system: true, sender_avatar_url: 'https://example.com/a.png', is_read: true, created_date: '2020-01-01T00:00:00Z' },
  { id: 'm3', subject: 'Loan offer', body: 'Loan', message_type: 'loan_offer', status: 'pending', is_read: false, metadata: { loan_id: 'l1' }, created_date: new Date().toISOString() },
];
const LAYOUT_VM = (open) => ({
  open,
  player: { id: 'p1', gamertag: 'NightOwl_10', avatar_url: null },
  club: CLUB,
  clubRank: { rank: 12, row: { ranking_points: 41, wins: 3, draws: 1, losses: 2 } },
  playerRank: { rank: 4 },
  nextMatch: { id: 'm1', scheduled_date: NOW_ISO, competition: 'League' },
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
  patchPlayer: noop,
});
const EMPTY_VM = (open) => ({
  ...LAYOUT_VM(open), club: null, clubRank: null, playerRank: null, nextMatch: null, tenure: null, glance: null,
  form: { stage: [], rating: [] }, transferWindowOpen: false, wins: 0, draws: 0, losses: 0, avgRating: 0, winRate: 0, rankingPoints: 0,
});

const tabState = () => ({
  state: { index: 0, routes: ['dashboard', 'matches', 'tournaments', 'profile', 'search'].map((n) => ({ key: n, name: n })) },
  descriptors: {
    dashboard: { options: { title: 'Home', tabBarIcon: () => null, tabBarAccessibilityLabel: 'Home' } },
    matches: { options: { title: 'Game Day' } },
    tournaments: { options: { title: 'Tournaments' } },
    profile: { options: { title: 'Profile' } },
    search: { options: { title: 'Search', tabBarHideOnKeyboard: true } },
  },
  navigation: { emit: () => ({ defaultPrevented: false }), navigate: noop },
});

// Keyed `<path under src>#<export>`. A function returns a list of prop variants (optional branches).
const FIXTURES = {
  'components/ui/IconButton.jsx#default': () => [{ icon: 'close', accessibilityLabel: 'Close', onPress: noop }],
  'components/ui/index.js#IconButton': () => [{ icon: 'close', accessibilityLabel: 'Close', onPress: noop }],
  'components/ui/FloatingTabBar.jsx#default': () => [tabState()],
  'components/ui/index.js#FloatingTabBar': () => [tabState()],
  'components/dashboard/DashboardLayoutLab.jsx#DashboardLayoutBody': () => (
    ['A', 'B', 'C', 'D'].flatMap((layout) => [{ layout, vm: LAYOUT_VM(noop) }, { layout, vm: EMPTY_VM(noop) }])
  ),
  'components/matches/GameDayDressingRoom.jsx#default': () => [
    { game: GAME, myClub: CLUB, myPlayer: PLAYER },
    { game: { ...GAME, status: 'completed' }, myClub: CLUB, myPlayer: PLAYER, embedded: true },
    { game: GAME },
  ],
  'components/matches/GameDayDressingRoomPanel.jsx#default': () => [
    { game: GAME, myClub: CLUB, myPlayer: PLAYER, dressingCounts: { home: 3, away: 2 } },
    { game: { ...GAME, status: 'in_progress' }, myClub: CLUB, myPlayer: PLAYER },
  ],
  'components/matches/MatchHubCards.jsx#GameDayFixtureChip': () => EVENTS.map((event) => ({ event, myClub: CLUB, selected: event.status === 'live' })),
  'components/matches/MatchHubCards.jsx#GameDayMatchCard': () => EVENTS.map((event) => ({ event, onPress: noop })),
  'components/matches/MatchHubCards.jsx#ScheduleMatchRow': () => EVENTS.map((event) => ({ event, onPress: noop })),
  'components/matches/GameDayKickoffArena.jsx#default': () => [
    { homeName: 'Night Owls', awayName: 'Red Foxes', date: NOW_ISO, status: 'scheduled', statusLabel: 'Scheduled', competitionLabel: 'League', homeYou: true },
    { homeName: LONG_NAME, awayName: LONG_NAME, date: NOW_ISO, status: 'in_progress', statusLabel: 'Live', homeScore: 2, awayScore: 1, wagerStc: 1500000, compact: true },
    { homeName: 'A', awayName: 'B', date: NOW_ISO, status: 'completed', homeScore: 0, awayScore: 0, awayYou: true, onPress: noop },
  ],
  'components/matches/GameDayScoreReport.jsx#default': () => [
    { game: GAME, homeName: 'Night Owls', awayName: 'Red Foxes', isMyMatch: true, amIHomeTeam: true, isLive: true, showResultForm: true, onSubmitPress: noop },
    { game: { ...GAME, status: 'completed', home_score: 2, away_score: 1 }, homeName: 'A', awayName: 'B', isCompleted: true },
    { game: { ...GAME, status: 'disputed' }, homeName: 'A', awayName: 'B', isDisputed: true, isMyMatch: true },
  ],
  'components/matches/GameDayInsights.jsx#default': () => [{ game: GAME }, { game: { ...GAME, status: 'completed' } }],
  'components/matches/GameDayWagerCard.jsx#default': () => [
    { game: GAME, isMyMatch: true, amIHomeTeam: true, onGameUpdate: noop },
    { game: { ...GAME, status: 'completed', wager_stc: 1000 }, isMyMatch: false, amIHomeTeam: false },
  ],
  'components/matches/GameDayStreamCard.jsx#default': () => [
    { game: { ...GAME, stream_url: 'https://twitch.tv/x' }, isMyMatch: true, amIHomeTeam: true, onGameUpdate: noop },
    { game: GAME, isMyMatch: false, amIHomeTeam: false, isCompleted: true },
  ],
  'components/matches/GameDayFixtureActions.jsx#default': () => [
    { game: GAME, user: { id: 'u1' }, myPlayer: PLAYER, myClub: CLUB, isMyMatch: true, onGameUpdate: noop },
    { game: { ...GAME, status: 'in_progress' }, user: { id: 'u1' }, myPlayer: PLAYER, myClub: CLUB, isMyMatch: true },
  ],
  'components/matches/GameDayResultSheet.jsx#default': () => [{ visible: true, onClose: noop, game: GAME, myClub: CLUB, myPlayer: PLAYER, isHomeTeam: true, onSubmitted: noop }],
  'components/matches/GameDayTileBackgroundDialog.jsx#default': () => [{ visible: true, onClose: noop, player: PLAYER, tileKey: 'match_details', tileTitle: 'Match Details', canCustomize: true, onPlayerChanged: noop }],
  'components/matches/ArrangeGameModal.jsx#default': () => [{ visible: true, onClose: noop, myPlayer: PLAYER, myClub: CLUB, onSent: noop }],
  'components/matches/DateTimeZoneFields.jsx#default': () => [{ date: '2030-01-02', time: '21:00', timezone: 'Europe/Brussels', onDateChange: noop, onTimeChange: noop, onTimezoneChange: noop }],
  'components/matches/GameDayCrest.jsx#default': () => [{ name: 'Night Owls' }, { name: 'X', imageUrl: 'https://example.com/c.png' }],
  'components/matches/GameDayKickoffActions.jsx#default': () => [
    { controls: { canKickoff: true, canConfirm: false }, loading: false, onKickoff: noop },
    { controls: {}, loading: true, onKickoff: noop },
  ],
  'components/tournament/TournamentCard.jsx#default': () => TOURNAMENT_STATUSES.map((tournament) => ({ tournament, onPress: noop })).concat([
    { tournament: { ...TOURNAMENT, name: LONG_NAME + LONG_NAME, banner_url: 'https://example.com/b.png', type: 'league', registered_clubs: Array.from({ length: 16 }, (_, i) => ({ id: i })) } },
  ]),
  'components/tournament/TournamentStages.jsx#default': () => TOURNAMENT_STATUSES.map((tournament) => ({
    tournament,
    matches: [
      { id: 'a', round: 1, stage: 'group', group: 'A', status: 'completed', home_club_id: 'c1', away_club_id: 'c2', home_club_name: 'A', away_club_name: 'B', home_score: 1, away_score: 0 },
      { id: 'b', round: 2, stage: 'knockout', status: 'scheduled', home_club_id: 'c1', away_club_id: 'c2', home_club_name: 'A', away_club_name: 'B' },
    ],
  })),
  'components/tournament/TournamentCountdown.jsx#default': () => [{ startDate: '2099-01-01T10:00:00Z' }, { startDate: '2000-01-01T10:00:00Z' }, {}],
  'components/tournament/StandingsTable.jsx#default': () => [
    { rows: [{ id: 1, name: 'A', played: 1, wins: 1, draws: 0, losses: 0, goalsFor: 2, goalsAgainst: 0, points: 3 }] },
    { rows: [{ id: 1, name: LONG_NAME, played: 10, wins: 5, draws: 3, losses: 2, goalsFor: 22, goalsAgainst: 10, points: 18 }], compact: true },
    { rows: [] },
  ],
  'components/tournament/GroupTable.jsx#default': () => [
    { group: { name: 'A', teams: [{ id: 1, name: 'A', played: 1, wins: 1, draws: 0, losses: 0, goalsFor: 2, goalsAgainst: 0, points: 3 }] } },
    { group: { name: 'B', standings: [] } },
  ],
  'components/tournament/CompetitionHeader.jsx#default': () => [{ eyebrow: 'League', title: 'Autumn Cup', onBack: noop, testID: 'ch' }, { title: LONG_NAME + LONG_NAME }],
  'components/tournament/BracketView.jsx#default': () => [
    { rounds: [{ name: 'Final', matches: [{ id: 'f', home_club_name: 'A', away_club_name: 'B', home_score: 1, away_score: 0, status: 'completed' }] }] },
    { rounds: [] },
    { matches: [{ id: 'f', round: 1, home_club_name: 'A', away_club_name: 'B', status: 'scheduled' }, { id: 'g', round: 2, status: 'scheduled' }] },
  ],
  'components/club/SquadPlayerCard.jsx#default': () => [
    {
      player: PLAYER, clubStats: { games: 4, goals: 2, assists: 1 },
      contractSummary: { key: 'active', label: 'Active Contract', color: '#000' }, availabilitySummary: { key: 'available', label: 'Available', color: '#000' },
      menuActions: [{ label: 'Release', onPress: noop }], onOpenProfile: noop,
    },
    { player: { ...PLAYER, gamertag: LONG_NAME, avatar_url: 'https://example.com/a.png' }, contractSummary: { key: 'trial', label: 'Trial' }, availabilitySummary: { key: 'maybe', label: 'Maybe' } },
  ],
  'components/club/ClubHero.jsx#default': () => [
    { club: CLUB, president: { id: 'p9', gamertag: 'Boss', avatar_url: 'https://example.com/a.png' }, record: { wins: 3, draws: 1, losses: 2 }, memberCount: 11, onBack: noop, onOpenPresident: noop },
    { club: { ...CLUB, name: LONG_NAME + LONG_NAME, banner_url: 'https://example.com/b.png' }, president: null, record: null, memberCount: 0, extraActions: null },
  ],
  'components/club/ClubIdentityCard.jsx#default': () => [{ imageUrl: 'https://example.com/a.png', tag: 'NOW', platform: 'PlayStation', onPress: noop }, { tag: 'X' }],
  'components/club/ClubOfficePanel.jsx#default': () => [
    {
      contracts: [{ id: 'k1', player_id: 'p1', status: 'active', contract_type: 'standard', weekly_wage: 5000 }], players: [PLAYER],
      stadium: { name: 'Owl Park', capacity: 20000 }, finance: { balance: 100000 }, shirts: [{ id: 's1', number: 9 }],
      auditLogs: [{ id: 'a1', action: 'signed', created_date: NOW_ISO }], contractPlayerName: () => 'Night Owl', statusLabel: (x) => String(x),
      getContractTypeLabel: (x) => String(x), weeklyWage: () => '5,000 STC',
    },
    {},
  ],
  'components/club/ClubFixturesPanel.jsx#default': () => [{ clubId: 'c1', myPlayer: PLAYER, onAvailabilityRowsChange: noop }, {}],
  'components/club/ClubStatsPanel.jsx#default': () => [{ clubId: 'c1', myPlayer: PLAYER }, {}],
  'components/inbox/InboxMessageList.jsx#default': () => [{ messages: INBOX_MESSAGES, onSelect: noop }, { messages: [] }],
  'components/inbox/InboxMessageDetail.jsx#default': () => INBOX_MESSAGES.map((message) => ({ message, onBack: noop, onDeleted: noop, onStatusChanged: noop })),
  // The mocked stage client serves a loan whose purchase clause is the suffix of the loan id.
  'components/inbox/InboxLoanCard.jsx#default': () => ['loan-OPTIONAL', 'loan-MANDATORY', 'loan-NONE', undefined].flatMap((related_entity_id) => ([
    { message: { id: 'l1', message_type: 'loan_proposal', related_entity_id, metadata: '{}' }, onActioned: noop },
    { message: { id: 'l2', message_type: 'loan_response', related_entity_id, metadata: '{}', status: 'pending' }, onActioned: noop },
  ])),
  'components/settings/AccountRoleUpgradeSection.jsx#default': () => [{ t: (key) => key }],
  'components/settings/NotificationChannelSwitches.jsx#default': () => [{ settings: { push_enabled: true }, channel: 'push', onToggle: noop }, { settings: {}, channel: 'email', onToggle: noop }],
  'components/settings/NotificationPushSection.jsx#default': () => ['granted', 'denied', 'undetermined', 'unavailable'].map((status) => ({ status, busy: status === 'denied', onToggle: noop })),
  'components/chat/ChatMessageBubble.jsx#default': () => [
    { item: { id: '1', message_type: 'text', content: 'hello', created_at: NOW_ISO, sender_name: 'Owl' }, isMe: true },
    { item: { id: '2', message_type: 'text', content: 'hi', created_at: NOW_ISO, sender_name: 'Fox' }, isMe: false, showSender: false },
    { item: { id: '3', message_type: 'image', media_url: '/x.png', created_at: NOW_ISO }, isMe: false, baseUrl: 'http://localhost' },
    { item: { id: '4', message_type: 'link', content: 'x', media_metadata: JSON.stringify({ title: 'Link', description: 'desc' }) }, isMe: true },
    { item: { id: '5', message_type: 'poll', content: 'Poll?', media_metadata: JSON.stringify({ question: 'Q', options: [{ id: 'a', text: 'A', votes: 1 }, { id: 'b', text: 'B', votes: 0 }] }) }, isMe: false, onPollVote: noop, currentUserId: 'u1' },
  ],
  'components/chat/ChatAttachmentMenu.jsx#default': () => [{ visible: true, onClose: noop, onSelect: noop }],
  'components/chat/ChatFilterChips.jsx#default': () => [{ onToggle: noop }],
  'components/apps/AppDirectoryScreen.jsx#FilterChips': () => [{ options: [{ id: 'all', label: 'All' }, 'income'], value: 'all', onChange: noop }],
  'components/directory/DirectoryResultRow.jsx#default': () => [
    { imageUrl: 'https://example.com/a.png', bannerUrl: 'https://example.com/b.png', bannerZoom: 150, initials: 'NO', name: LONG_NAME, badges: ['ST', 'LB'], meta: 'Belgium · PS5', actionLabel: 'VIEW PROFILE', onPress: noop, onAction: noop },
    { initials: 'X', name: 'X', meta: '', onPress: noop },
  ],
  'components/directory/DirectorySearchField.jsx#default': () => [{ value: 'abc', onChangeText: noop, placeholder: 'Search', accessibilityLabel: 'Search', clearLabel: 'Clear' }],
  'components/directory/DirectoryDetailSheet.jsx#default': () => [{ visible: true, onClose: noop, title: 'Night Owl', imageUrl: null, initials: 'NO', primaryLabel: 'Invite', onPrimary: noop, secondaryLabel: 'Close', onSecondary: noop }],
  'components/directory/DirectoryClubPhotoCard.jsx#default': () => [{ club: CLUB }, { club: { ...CLUB, logo_url: 'https://example.com/a.png', name: LONG_NAME } }],
  'components/directory/HubToggle.jsx#default': () => [{ label: 'Players', icon: 'person-outline', active: true, badge: 3, onPress: noop }, { label: 'Clubs', icon: 'shield-outline', active: false, onPress: noop }],
  'components/directory/FilterListBox.jsx#default': () => [{ label: 'Position', value: 'All', onChange: noop, options: ['All', 'ST'] }],
  'components/transfer/TransferBadge.jsx#default': () => ['open', 'closing', 'closed', 'loan', 'free_agent'].map((type) => ({ type, daysLeft: 3 })),
  'components/transfer/TransferWindowBanner.jsx#default': () => [{ window: { is_open: true, days_left: 5 } }, { window: { is_open: false } }, { window: null }],
  'components/transfer/TransferFilters.jsx#default': () => [{ search: '', onSearch: noop, position: 'All', onPosition: noop, statusFilter: 'all', onStatus: noop, platform: 'All', onPlatform: noop }],
  'components/transfer/TransferPlayerPhotoCard.jsx#default': () => [{ player: PLAYER }, { player: { ...PLAYER, avatar_url: 'https://example.com/a.png', gamertag: LONG_NAME } }],
  'components/transfer/TransferDetailSheet.jsx#default': () => [{ visible: true, entry: { player: PLAYER, club: CLUB, listing: { id: 'l1', type: 'transfer' } }, onClose: noop, onViewProfile: noop }, { visible: true, entry: null, onClose: noop }],
  'components/transfer/RequestLoanDialog.jsx#default': () => [{ open: true, onClose: noop, player: PLAYER, club: CLUB, onSubmitted: noop }],
  'components/profile/PlayerCareerSummary.jsx#default': () => [
    { career: { appearances: 10, goals: 4, assists: 2, clubs: [{ id: 'c1', name: 'Night Owls' }] }, loading: false },
    { career: null, loading: true },
  ],
  'components/profile/ProfileCareerBoard.jsx#default': () => [{ player: PLAYER, signedClub: CLUB, career: null, careerLoading: false }, { player: PLAYER, signedClub: null, career: { appearances: 1 }, careerLoading: true }],
  'components/profile/PlayerShowcase.jsx#default': () => [{ player: PLAYER, onChanged: noop }],
  'components/profile/PlayerTransferHistory.jsx#default': () => [{ playerId: 'p1' }],
  'components/profile/ProfileFeedPanel.jsx#default': () => [{ player: PLAYER, isOwn: true }, { player: PLAYER, isOwn: false }],
  'components/profile/FollowToggleButton.jsx#default': () => [{ targetType: 'player', targetId: 'p2', targetName: 'Fox' }],
  'components/profile/TrapeziumPhotoCard.jsx#default': () => [{ width: 160, height: 200, imageUrl: 'https://example.com/a.png', onPress: noop, chamfer: 16 }, { width: 160, height: 200 }],
  'components/schedule/ScheduleFixturesList.jsx#default': () => [{ events: EVENTS, onOpenMatch: noop }, { events: [] }],
  'components/schedule/ScheduleCalendar.jsx#default': () => [{ events: EVENTS, onOpenMatch: noop, timezone: 'Europe/Brussels' }, { events: [] }],
  'components/schedule/ScheduleCalendar.jsx#CategoryDot': () => [{ color: '#fff' }, { color: '#fff', shape: 'ring', size: 10 }, { color: '#fff', shape: 'diamond' }, { color: '#fff', shape: 'square' }],
  'components/settings/SettingsRows.jsx#SettingsRow': () => [{ icon: 'person-outline', title: 'Account', subtitle: 'sub', value: 'v', onPress: noop }, { icon: 'moon-outline', title: 'Dark', right: null }],
  'components/settings/SettingsListbox.jsx#SettingsListbox': () => [{ label: 'Lang', value: 'en', onChange: noop, title: 'Language', options: [{ id: 'en', label: 'English' }] }],
  'components/settings/SettingsListbox.jsx#OptionsBottomSheet': () => [{ visible: true, title: 'T', selectedId: 'en', onSelect: noop, onClose: noop, options: [{ id: 'en', label: 'English' }], tokens: useThemeStore.getState().tokens }],
};

// Nothing is skipped today: every exported component in COMPONENT_DIRS renders under jest with the mocks above.
// Add `'<path>#<export>': 'reason'` here for a component that genuinely cannot render in jest (native-only module).
// Not covered on purpose: src/components/{news,trophy} (kept, unwired, no mockup).
const SKIPPED = {};

describe('restyle smoke: components', () => {
  COMPONENT_DIRS.forEach((dir) => {
    const files = listFiles(path.join(SRC, 'components', dir)).sort();
    files.forEach((file) => {
      const name = rel(file);
      let mod;
      try {
        // eslint-disable-next-line global-require, import/no-dynamic-require
        mod = require(file);
      } catch (e) {
        test(`${name} can be imported`, () => { throw e; });
        return;
      }
      const exportsMap = {};
      Object.keys(mod).forEach((key) => {
        if (key === 'default' ? Boolean(mod.default) : isComponentExport(key, mod[key])) exportsMap[key] = mod[key];
      });
      Object.entries(exportsMap).forEach(([exportName, Comp]) => {
        const isComp = typeof Comp === 'function' || (Comp && Comp.$$typeof);
        if (!isComp) return;
        if (exportName === 'default' && !/^[A-Z]/.test(Comp.displayName || Comp.name || '') && !(Comp && Comp.$$typeof)) return;
        const key = `${name}#${exportName}`;
        THEMES.forEach((themeId) => {
          test(`${key} renders in ${themeId}`, async () => {
            if (SKIPPED[key]) return;
            useTheme(themeId);
            mockParams = {};
            const fixture = FIXTURES[key];
            const variants = typeof fixture === 'function' ? fixture() : [fixture || {}];
            for (const props of (Array.isArray(variants) ? variants : [variants])) {
              // eslint-disable-next-line no-await-in-loop
              // ui/ primitives always draw something; other components are conditional (empty fixtures render null on purpose).
              await renderChecked(key, React.createElement(Comp, props), { expectContent: dir === 'ui' });
            }
          });
        });
      });
    });
  });
});

