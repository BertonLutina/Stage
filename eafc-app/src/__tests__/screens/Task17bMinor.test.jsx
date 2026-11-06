import React from 'react';
import { StyleSheet } from 'react-native';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import useThemeStore from '../../store/themeStore';

jest.setTimeout(30000);

// --- shared mocks ------------------------------------------------------------------------------
const mockBack = jest.fn();
const mockReplace = jest.fn();
const mockPush = jest.fn();
let mockCanGoBack = true;
let mockParams = { slug: 'premier' };
jest.mock('expo-router', () => ({
  useRouter: () => ({
    back: (...a) => mockBack(...a),
    replace: (...a) => mockReplace(...a),
    push: (...a) => mockPush(...a),
    canGoBack: () => mockCanGoBack,
  }),
  useLocalSearchParams: () => mockParams,
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
jest.mock('@expo/vector-icons/Ionicons', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return { __esModule: true, default: ({ name }) => React.createElement(Text, null, name) };
});
jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return { Ionicons: ({ name }) => React.createElement(Text, null, name) };
});
jest.mock('expo-web-browser', () => ({ openBrowserAsync: jest.fn(), maybeCompleteAuthSession: jest.fn(), openAuthSessionAsync: jest.fn() }));
jest.mock('expo-auth-session', () => ({ makeRedirectUri: () => 'app://redirect' }));

// auth
const mockLogin = jest.fn(() => Promise.resolve(true));
jest.mock('../../store/authStore', () => {
  const state = { login: (...a) => mockLogin(...a), loading: false, error: null, clearError: jest.fn(), user: { id: 'u1' } };
  const useAuthStore = (selector) => (selector ? selector(state) : state);
  useAuthStore.setState = jest.fn();
  useAuthStore.getState = () => state;
  return { __esModule: true, default: useAuthStore };
});
jest.mock('../../utils/healthCheck', () => ({ checkBackendConnection: jest.fn(() => Promise.resolve({ ok: true })) }));
const mockBio = { enabled: false, available: true };
const mockSetBiometricEnabled = jest.fn(() => Promise.resolve());
jest.mock('../../services/biometricAuthService', () => ({
  biometricPromptCopy: () => ({ buttonLabel: 'Sign in with Face ID', settingsLabel: 'Face ID login' }),
  getBiometricCredentials: () => Promise.resolve(null),
  getBiometricEnabled: () => Promise.resolve(mockBio.enabled),
  getSupportedBiometricKinds: () => Promise.resolve(['face']),
  isBiometricAvailable: () => Promise.resolve(mockBio.available),
  saveBiometricCredentials: jest.fn(() => Promise.resolve()),
  setBiometricEnabled: (...a) => mockSetBiometricEnabled(...a),
  unlockSavedCredentials: jest.fn(() => Promise.resolve({ success: false, reason: 'none' })),
}));
jest.mock('../../hooks/useSocialAuth', () => ({
  openSocialAuth: jest.fn(),
  STAGE_OAUTH_PROVIDERS: ['google', 'microsoft', 'twitch', 'kick'],
}));

// api / data
const mockApiGet = jest.fn();
const mockApiPut = jest.fn(() => Promise.resolve({}));
jest.mock('../../utils/api', () => ({
  __esModule: true,
  default: {
    get: (...a) => mockApiGet(...a),
    put: (...a) => mockApiPut(...a),
    defaults: { baseURL: 'http://test' },
  },
}));
const mockHttpGet = jest.fn();
jest.mock('../../api/stageClient', () => ({
  resolveMyPlayerAndClub: jest.fn(() => Promise.resolve({ user: { id: 'u1' }, club: null })),
  stageClient: { http: { get: (...a) => mockHttpGet(...a) }, entities: {} },
}));
const LONG_HOME = 'Borussia Monchengladbach Reserves';
const LONG_AWAY = 'Wolverhampton Wanderers United';
const mockFixtures = [
  { id: 'f1', matchday: 1, home_club_name: LONG_HOME, away_club_name: LONG_AWAY, status: 'scheduled' },
];
jest.mock('../../lib/competitionSeason', () => {
  const actual = jest.requireActual('../../lib/competitionSeason');
  return {
    ...actual,
    loadCompetitionDetail: jest.fn(() => Promise.resolve({
      meta: { name: 'Premier' }, season: { id: 's1' }, standings: [], fixtures: mockFixtures,
    })),
    loadLeagueDetail: jest.fn(() => Promise.resolve({
      league: { id: 'l1', name: 'Premier League' }, standings: [], fixtures: mockFixtures,
    })),
  };
});
jest.mock('../../lib/gameDayIntegration', () => ({ createMatchFromFixture: jest.fn() }));
jest.mock('../../lib/scheduleEngine', () => ({ proposeTime: jest.fn(), roleForClub: () => null }));

const TournamentCard = require('../../components/tournament/TournamentCard').default;
const TournamentLeaderboard = require('../../components/tournament/TournamentLeaderboard').default;
const SocialAuthIconButtons = require('../../components/auth/SocialAuthIconButtons').default;
const ChatAttachmentMenu = require('../../components/chat/ChatAttachmentMenu').default;
const { SectionTitle } = require('../../components/dashboard/CommandCenterUI');
const { headingStyle } = require('../../lib/fonts');
const LoginScreen = require('../../app/auth/loginscreen').default;
const AvailabilityScreen = require('../../app/(tabs)/profile/availabilityscreen').default;
const CompetitionDetailScreen = require('../../app/apps/competitions/[slug]').default;
const LeagueDetailScreen = require('../../app/apps/leagues/[slug]').default;

function useTheme(id) {
  const store = {};
  global.localStorage = {
    getItem: (key) => (Object.prototype.hasOwnProperty.call(store, key) ? store[key] : null),
    setItem: (key, value) => { store[String(key)] = String(value); },
    removeItem: (key) => { delete store[String(key)]; },
  };
  useThemeStore.getState().setStageTheme(id);
}

const flat = (node) => StyleSheet.flatten(node.props.style) || {};

beforeEach(() => {
  jest.clearAllMocks();
  mockCanGoBack = true;
  mockParams = { slug: 'premier' };
  mockBio.enabled = false;
  mockBio.available = true;
  useTheme('theme-dark');
});

// --- A.4 TournamentCard ---------------------------------------------------------------------------
describe('TournamentCard accessibility label', () => {
  const base = { id: 't1', name: 'Autumn Cup', type: 'knockout', max_teams: 16, registered_clubs: [1, 2, 3] };

  test('names the tournament, status, registered/max and the fee', () => {
    const { getByLabelText } = render(
      <TournamentCard tournament={{ ...base, status: 'registration', entry_fee_stc: 150000 }} onPress={() => {}} />,
    );
    const node = getByLabelText(`Autumn Cup, Open, 3 of 16 registered, entry ${(150000).toLocaleString()} STC`);
    expect(node.props.accessibilityRole).toBe('button');
  });

  test('free entry, live and full states are spoken too', () => {
    const live = render(
      <TournamentCard tournament={{ ...base, status: 'in_progress' }} onPress={() => {}} />,
    );
    expect(live.getByLabelText('Autumn Cup, Live, 3 of 16 registered, entry Free')).toBeTruthy();
    live.unmount();
    const full = render(
      <TournamentCard
        tournament={{ ...base, status: 'registration', max_teams: 3 }}
        onPress={() => {}}
      />,
    );
    expect(full.getByLabelText('Autumn Cup, Full, 3 of 3 registered, entry Free')).toBeTruthy();
  });
});

// --- A.8 SocialAuthIconButtons ----------------------------------------------------------------------
describe('SocialAuthIconButtons labels', () => {
  test.each(['signin', 'signup'])('%s mode reads "Continue with X", never "Sign in with Continue with X"', (mode) => {
    const { getByLabelText, queryByLabelText, getAllByRole } = render(<SocialAuthIconButtons mode={mode} />);
    ['Google', 'Microsoft', 'Kick', 'Twitch'].forEach((name) => {
      expect(getByLabelText(`Continue with ${name}`).props.accessibilityRole).toBe('button');
    });
    expect(queryByLabelText(/Sign (in|up) with Continue/)).toBeNull();
    expect(getAllByRole('button')).toHaveLength(4);
  });
});

// --- A.10 ChatAttachmentMenu --------------------------------------------------------------------------
describe('ChatAttachmentMenu structure', () => {
  test('scrim is a sibling Dismiss button and the sheet is a plain view (not a nested Pressable)', () => {
    const onClose = jest.fn();
    const onSelect = jest.fn();
    const { getByLabelText, getAllByLabelText, queryByLabelText, getByText } = render(
      <ChatAttachmentMenu visible onClose={onClose} onSelect={onSelect} />,
    );
    const tokens = useThemeStore.getState().tokens;
    const dismiss = getByLabelText('Dismiss');
    expect(dismiss.props.accessibilityRole).toBe('button');
    expect(flat(dismiss).position).toBe('absolute');
    expect(flat(dismiss).backgroundColor).toBe(tokens.overlay);
    expect(queryByLabelText('Close attachment menu')).toBeNull();
    // the scrim must not wrap the sheet or its controls
    expect(dismiss.findAll((n) => n.props?.accessibilityLabel === 'Camera')).toHaveLength(0);
    let ancestor = getByLabelText('Camera').parent;
    while (ancestor) {
      expect(ancestor.props?.accessibilityLabel).not.toBe('Dismiss');
      ancestor = ancestor.parent;
    }
    fireEvent.press(dismiss);
    expect(onClose).toHaveBeenCalledTimes(1);
    // every option stays a separate button
    expect(getAllByLabelText(/Camera|Gallery|File|Voice note|GIF|Sticker|Create poll|Share contact/)).toHaveLength(8);
    fireEvent.press(getByLabelText('Gallery'));
    expect(onSelect).toHaveBeenCalledWith('gallery');
    expect(onClose).toHaveBeenCalledTimes(2);
    // sheet is not a pressable that swallows touches any more
    let sheet = getByText('Attach').parent;
    while (sheet && flat(sheet).backgroundColor !== tokens.bgDeep) sheet = sheet.parent;
    expect(sheet).toBeTruthy();
    expect(sheet.props.onPress).toBeUndefined();
    expect(sheet.props.accessibilityRole).toBeUndefined();
    expect(flat(sheet).borderTopLeftRadius).toBe(22);
  });
});

// --- B.21 TournamentLeaderboard chevron -----------------------------------------------------------------
describe('TournamentLeaderboard category picker chevron', () => {
  test('chevron flips up while the picker is open and back down when it closes', async () => {
    mockHttpGet.mockResolvedValue({ participant_type: 'club', confirmed_matches: 1, participants: { goals: [] } });
    const { findByLabelText, getByLabelText, getByText, queryByText } = render(
      <TournamentLeaderboard tournamentId="t1" />,
    );
    const select = await findByLabelText('Category');
    expect(select).toBeTruthy();
    expect(getByText('chevron-down')).toBeTruthy();
    fireEvent.press(getByLabelText('Category'));
    expect(getByText('chevron-up')).toBeTruthy();
    expect(queryByText('chevron-down')).toBeNull();
    fireEvent.press(getByText('Most Goals Conceded'));
    await waitFor(() => expect(getByText('chevron-down')).toBeTruthy());
    expect(queryByText('chevron-up')).toBeNull();
  });
});

// --- C.26 SectionTitle -----------------------------------------------------------------------------------
describe('CommandCenterUI SectionTitle', () => {
  test('letter spacing is 0.03em of the heading font size', () => {
    const { getByText } = render(<SectionTitle>Results</SectionTitle>);
    const style = flat(getByText('Results'));
    expect(style.fontSize).toBe(headingStyle.fontSize);
    expect(style.letterSpacing).toBeCloseTo(headingStyle.fontSize * 0.03, 10);
    expect(style.letterSpacing).toBeCloseTo(0.6, 10);
    expect(style.textTransform).toBe('uppercase');
  });
});

// --- A.7 login biometric row -------------------------------------------------------------------------------
describe('Login biometric toggle row', () => {
  test('is a switch exposing its checked state and flips it', async () => {
    const { findByLabelText } = render(<LoginScreen />);
    const row = await findByLabelText('Face ID login');
    expect(row.props.accessibilityRole).toBe('switch');
    expect(row.props.accessibilityState).toEqual({ checked: false });
    await act(async () => { fireEvent.press(row); });
    expect((await findByLabelText('Face ID login')).props.accessibilityState).toEqual({ checked: true });
    expect(mockSetBiometricEnabled).toHaveBeenCalledWith(true);
    await act(async () => { fireEvent.press(await findByLabelText('Face ID login')); });
    expect((await findByLabelText('Face ID login')).props.accessibilityState).toEqual({ checked: false });
    expect(mockSetBiometricEnabled).toHaveBeenLastCalledWith(false);
  });

  test('starts checked when biometrics are already enabled', async () => {
    mockBio.enabled = true;
    const { findByLabelText } = render(<LoginScreen />);
    await waitFor(async () => {
      expect((await findByLabelText('Face ID login')).props.accessibilityState.checked).toBe(true);
    });
  });

  test('no row when biometrics are unavailable', async () => {
    mockBio.available = false;
    const { queryByLabelText, findByText } = render(<LoginScreen />);
    await findByText('Welcome back');
    await act(async () => { await Promise.resolve(); });
    expect(queryByLabelText('Face ID login')).toBeNull();
  });

  test('social buttons on the login screen are labelled "Continue with X"', async () => {
    const { findByLabelText } = render(<LoginScreen />);
    expect(await findByLabelText('Continue with Google')).toBeTruthy();
  });
});

// --- B.19 Availability back ----------------------------------------------------------------------------------
describe('Availability screen back button', () => {
  beforeEach(() => {
    mockApiGet.mockResolvedValue({ data: { data: [] } });
  });

  test('is a labelled 44 high chevron button that pops the screen', async () => {
    const { getByLabelText, getByText } = render(<AvailabilityScreen />);
    await waitFor(() => expect(mockApiGet).toHaveBeenCalled());
    const back = getByLabelText('Back');
    expect(flat(back).width).toBe(44);
    expect(flat(back).height).toBe(44);
    expect(getByText('chevron-back')).toBeTruthy();
    fireEvent.press(back);
    expect(mockBack).toHaveBeenCalledTimes(1);
    expect(mockReplace).not.toHaveBeenCalled();
    expect(getByText('Availability')).toBeTruthy();
  });

  test('falls back to the profile tab when there is no history', async () => {
    mockCanGoBack = false;
    const { getByLabelText } = render(<AvailabilityScreen />);
    await waitFor(() => expect(mockApiGet).toHaveBeenCalled());
    fireEvent.press(getByLabelText('Back'));
    expect(mockReplace).toHaveBeenCalledWith('/(tabs)/profile');
    expect(mockBack).not.toHaveBeenCalled();
  });

  test('adjacent grid cells are saved as one real availability range', async () => {
    const { getByLabelText, getByText } = render(<AvailabilityScreen />);
    await waitFor(() => expect(mockApiGet).toHaveBeenCalled());
    await act(async () => { fireEvent.press(getByLabelText('Monday 18–20, busy')); });
    await waitFor(() => expect(getByLabelText('Monday 18–20, available')).toBeTruthy());
    await act(async () => { fireEvent.press(getByLabelText('Monday 20–22, busy')); });
    await act(async () => { fireEvent.press(getByText('Save availability')); });
    expect(mockApiPut).toHaveBeenCalledWith('/users/u1/availability', {
      slots: [{ day_of_week: 1, start_time: '18:00', end_time: '22:00' }],
    });
  });
});

// --- B.15 fixture line wraps ----------------------------------------------------------------------------------
describe('competition and league fixture lines', () => {
  test.each([
    ['competition', CompetitionDetailScreen],
    ['league', LeagueDetailScreen],
  ])('%s: "Home vs Away" may wrap to two lines so the away team is not cut off', async (_name, Screen) => {
    const { findByText, getByText } = render(<Screen />);
    await findByText('Premier', { exact: false });
    fireEvent.press(getByText('FIXTURES'));
    const line = getByText(`${LONG_HOME} vs ${LONG_AWAY}`);
    expect(line.props.numberOfLines).toBe(2);
    // the status line underneath stays on one line
    expect(getByText('scheduled').props.numberOfLines).toBe(1);
  });
});
