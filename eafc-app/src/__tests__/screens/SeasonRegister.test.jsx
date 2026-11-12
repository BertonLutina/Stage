import React from 'react';
import { StyleSheet } from 'react-native';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import useThemeStore from '../../store/themeStore';
import { REGIONS } from '../../lib/qualificationConfig';

jest.setTimeout(30000);

const mockBack = jest.fn();
const mockPush = jest.fn();
const mockResolve = jest.fn();
const mockGet = jest.fn();
const mockPost = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ back: (...a) => mockBack(...a), push: (...a) => mockPush(...a), canGoBack: () => true }),
  usePathname: () => '/apps/register',
}));
jest.mock('expo-linear-gradient', () => {
  const React = require('react');
  const { View } = require('react-native');
  return { LinearGradient: ({ children, style }) => React.createElement(View, { style }, children) };
});
jest.mock('@expo/vector-icons/Ionicons', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return { __esModule: true, default: ({ name, ...rest }) => React.createElement(Text, rest, name) };
});
jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return { Ionicons: ({ name, ...rest }) => React.createElement(Text, rest, name) };
});
jest.mock('expo-blur', () => {
  const React = require('react');
  const { View } = require('react-native');
  return { BlurView: ({ children, style }) => React.createElement(View, { style }, children) };
});
jest.mock('../../api/stageClient', () => ({
  resolveMyPlayerAndClub: (...a) => mockResolve(...a),
  stageClient: { http: { get: (...a) => mockGet(...a), post: (...a) => mockPost(...a) } },
}));

const RegisterScreen = require('../../app/apps/register').default;

const REGION = REGIONS[0];
const club = { id: 'c1', name: 'Red Foxes', platform: 'PS5' };
const DAY = 86400000;

const win = (over = {}) => ({
  id: 'w1', region_slug: REGION.slug, platform: 'ps5', season_number: 5, phase: 'registration',
  policy_version: 'rv1', rules_text: 'Rule one. Rule two.',
  registration_closes_at: '2026-11-29T00:00:00Z', confirmation_closes_at: '2026-12-06T00:00:00Z',
  league_start_monday: '2026-12-14',
  ...over,
});
const PLAYERS = [
  { id: 'p1', gamertag: 'Alpha', status: 'eligible' },
  { id: 'p2', gamertag: 'Bravo', status: 'eligible' },
  { id: 'p3', gamertag: 'Charlie', status: 'eligible' },
  { id: 'p4', gamertag: 'Delta', status: 'plus_required' },
];
const readiness = (over = {}) => ({
  club: { id: 'c1', name: 'Red Foxes' },
  can_manage_registration: true,
  registrar_status: 'eligible',
  minimum_players: 3,
  eligible_count: 3,
  players: PLAYERS,
  registrations: [],
  ...over,
});
const application = (over = {}) => ({
  id: 'a1', registration_window_id: 'w1', status: 'pending', participation_status: 'registered', ...over,
});

function setup({ windows = [win()], ready = readiness(), identity = { presidentClub: club, club }, readyError = null, windowsError = null } = {}) {
  mockResolve.mockResolvedValue({ user: { id: 'u1' }, player: null, ...identity });
  mockGet.mockImplementation((path) => {
    if (path === '/regional-leagues/registration-windows') {
      return windowsError ? Promise.reject(windowsError) : Promise.resolve({ windows });
    }
    if (path.startsWith('/regional-leagues/registration-readiness/')) {
      return readyError ? Promise.reject(readyError) : Promise.resolve(ready);
    }
    return Promise.reject(new Error(`unexpected ${path}`));
  });
  mockPost.mockResolvedValue({ ok: true });
}

function useTheme(id) {
  const store = {};
  global.localStorage = {
    getItem: (key) => (Object.prototype.hasOwnProperty.call(store, key) ? store[key] : null),
    setItem: (key, value) => { store[String(key)] = String(value); },
    removeItem: (key) => { delete store[String(key)]; },
  };
  useThemeStore.getState().setStageTheme(id);
}

describe('Season registration screen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useTheme('theme-dark');
  });

  test('loading shows skeletons and the back button, no content yet', () => {
    mockResolve.mockReturnValue(new Promise(() => {}));
    const r = render(<RegisterScreen />);
    expect(r.getByLabelText('Back')).toBeTruthy();
    expect(r.getByTestId('skeleton-list')).toBeTruthy();
    expect(r.queryByText('Register my club')).toBeNull();
  });

  test('open window: the register button waits for the rules to be accepted, then posts the apply', async () => {
    setup();
    const r = render(<RegisterScreen />);
    await waitFor(() => r.getByText(`${REGION.name} · Season 5`));
    expect(r.getByText('Registration open')).toBeTruthy();
    expect(r.getByText('First league week: ' + new Date('2026-12-14').toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }))).toBeTruthy();
    expect(r.getByText(/follow sporting placement/)).toBeTruthy();

    const apply = r.getByLabelText('Register my club');
    expect(apply.props.accessibilityState.disabled).toBe(true);
    fireEvent.press(r.getByLabelText(/I accept the published/));
    fireEvent.changeText(r.getByPlaceholderText('Note to admins (optional)'), ' hello ');
    fireEvent.press(r.getByLabelText('Register my club'));
    await waitFor(() => expect(mockPost).toHaveBeenCalledWith('/regional-leagues/registration-windows/w1/apply', {
      club_id: 'c1', policy_version: 'rv1', note: 'hello',
    }));
    await waitFor(() => expect(mockGet.mock.calls.filter(([p]) => p.includes('registration-windows')).length).toBe(2));
  });

  test('the rules open on demand and show the revision', async () => {
    setup();
    const r = render(<RegisterScreen />);
    await waitFor(() => r.getByText('Edition rules'));
    expect(r.queryByText('Rule one. Rule two.')).toBeNull();
    fireEvent.press(r.getByText('Edition rules'));
    expect(r.getByText('Rule one. Rule two.')).toBeTruthy();
    expect(r.getByText('Revision rv1')).toBeTruthy();
  });

  test('a failed apply shows the server message and keeps the form', async () => {
    setup();
    mockPost.mockRejectedValue(new Error('Plus required'));
    const r = render(<RegisterScreen />);
    await waitFor(() => r.getByLabelText(/I accept the published/));
    fireEvent.press(r.getByLabelText(/I accept the published/));
    fireEvent.press(r.getByLabelText('Register my club'));
    await waitFor(() => r.getByText('Plus required'));
    expect(r.getByLabelText('Register my club')).toBeTruthy();
  });

  test('registrar without Plus: upsell routes to the store and the register button stays locked', async () => {
    setup({ ready: readiness({ registrar_status: 'plus_required' }) });
    const r = render(<RegisterScreen />);
    await waitFor(() => r.getByText('STAGE Plus needed'));
    fireEvent.press(r.getByText('Open Store'));
    expect(mockPush).toHaveBeenCalledWith('/apps/store');
    fireEvent.press(r.getByLabelText(/I accept the published/));
    expect(r.getByLabelText('Register my club').props.accessibilityState.disabled).toBe(true);
  });

  test('a member who is not president can read but not act', async () => {
    setup({ ready: readiness({ can_manage_registration: false }) });
    const r = render(<RegisterScreen />);
    await waitFor(() => r.getByText(/Only the club president can register the club/));
    expect(r.queryByLabelText('Register my club')).toBeNull();
  });

  test('no club: explanation, the windows stay readable, readiness is never requested', async () => {
    setup({ identity: { presidentClub: null, club: null } });
    const r = render(<RegisterScreen />);
    await waitFor(() => r.getByText(/Join or create a club to register/));
    expect(r.getByText(`${REGION.name} · Season 5`)).toBeTruthy();
    expect(mockGet.mock.calls.some(([p]) => p.includes('registration-readiness'))).toBe(false);
    expect(r.queryByLabelText('Register my club')).toBeNull();
  });

  test('403 on readiness shows the server message', async () => {
    setup({ readyError: { status: 403, message: 'This club is not yours' } });
    const r = render(<RegisterScreen />);
    await waitFor(() => r.getByText('This club is not yours'));
  });

  test('no published window: empty state, nothing invented', async () => {
    setup({ windows: [] });
    const r = render(<RegisterScreen />);
    await waitFor(() => r.getByText(/No registration dates are published yet/));
  });

  test('confirmation week: players list with reasons, three minimum, then confirm posts the ids', async () => {
    setup({
      windows: [win({ phase: 'confirmation' })],
      ready: readiness({ registrations: [application()] }),
    });
    const r = render(<RegisterScreen />);
    await waitFor(() => r.getByText('Confirmed players'));
    expect(r.getByText('Plus needed')).toBeTruthy();
    expect(r.getByText('0 selected')).toBeTruthy();
    const ineligible = r.getByLabelText('Delta, Plus needed');
    expect(ineligible.props.accessibilityState.disabled).toBe(true);

    fireEvent.press(r.getByLabelText(/I accept the published/));
    ['Alpha', 'Bravo'].forEach((n) => fireEvent.press(r.getByLabelText(`${n}, Eligible`)));
    expect(r.getByLabelText('Confirm participation').props.accessibilityState.disabled).toBe(true);
    fireEvent.press(r.getByLabelText('Charlie, Eligible'));
    expect(r.getByText('3 selected')).toBeTruthy();
    fireEvent.press(r.getByLabelText('Confirm participation'));
    await waitFor(() => expect(mockPost).toHaveBeenCalledWith('/regional-leagues/registrations/a1/confirm', {
      club_id: 'c1', policy_version: 'rv1', player_ids: ['p1', 'p2', 'p3'],
    }));
  });

  test('insufficient roster is explained', async () => {
    setup({
      windows: [win({ phase: 'confirmation' })],
      ready: readiness({ eligible_count: 2, registrations: [application()] }),
    });
    const r = render(<RegisterScreen />);
    await waitFor(() => r.getByText(/Not enough eligible players yet: 2 of 3/));
  });

  test('reserve invitation: accept needs players, decline posts straight away', async () => {
    const deadline = new Date(Date.now() + 3 * DAY).toISOString();
    setup({
      windows: [win({ phase: 'closed' })],
      ready: readiness({ registrations: [application({ reserve_invitation: { deadline } })] }),
    });
    const r = render(<RegisterScreen />);
    await waitFor(() => r.getByText(/A reserve place is offered/));
    fireEvent.press(r.getByLabelText('Decline'));
    await waitFor(() => expect(mockPost).toHaveBeenCalledWith('/regional-leagues/registrations/a1/reserve', {
      club_id: 'c1', policy_version: 'rv1', decision: 'decline',
    }));
  });

  test('reserve accept posts the chosen players', async () => {
    const deadline = new Date(Date.now() + 3 * DAY).toISOString();
    setup({
      windows: [win({ phase: 'closed' })],
      ready: readiness({ registrations: [application({ reserve_invitation: { deadline } })] }),
    });
    const r = render(<RegisterScreen />);
    await waitFor(() => r.getByLabelText('Accept reserve place'));
    fireEvent.press(r.getByLabelText(/I accept the published/));
    ['Alpha', 'Bravo', 'Charlie'].forEach((n) => fireEvent.press(r.getByLabelText(`${n}, Eligible`)));
    fireEvent.press(r.getByLabelText('Accept reserve place'));
    await waitFor(() => expect(mockPost).toHaveBeenCalledWith('/regional-leagues/registrations/a1/reserve', {
      club_id: 'c1', policy_version: 'rv1', decision: 'accept', player_ids: ['p1', 'p2', 'p3'],
    }));
  });

  test('already registered: status line, no register button', async () => {
    setup({ ready: readiness({ registrations: [application()] }) });
    const r = render(<RegisterScreen />);
    await waitFor(() => r.getByText('Registered, confirm during the confirmation week'));
    expect(r.queryByLabelText('Register my club')).toBeNull();
  });

  test('confirmed and placed: division and group come from the server', async () => {
    setup({
      windows: [win({ phase: 'closed' })],
      ready: readiness({ registrations: [application({
        status: 'approved', participation_status: 'confirmed', assigned_league_id: 'l1', assigned_division: 2, assigned_group_code: 'B',
      })] }),
    });
    const r = render(<RegisterScreen />);
    await waitFor(() => r.getByText('Participation confirmed'));
    expect(r.getByText('Division 2 · Group B')).toBeTruthy();
    fireEvent.press(r.getByLabelText('Open competitions'));
    expect(mockPush).toHaveBeenCalledWith('/apps/competitions');
  });

  test('refused and waiting list read as their own states', async () => {
    setup({
      windows: [win(), win({ id: 'w2', season_number: 6 })],
      ready: readiness({ registrations: [
        application({ status: 'rejected' }),
        application({ id: 'a2', registration_window_id: 'w2', status: 'waitlisted' }),
      ] }),
    });
    const r = render(<RegisterScreen />);
    await waitFor(() => r.getByText('Application refused'));
    expect(r.getByText('On the waiting list')).toBeTruthy();
  });

  test('load failure shows the message with Retry, which reloads', async () => {
    setup({ windowsError: new Error('Boom') });
    const r = render(<RegisterScreen />);
    await waitFor(() => r.getByText('Boom'));
    setup();
    fireEvent.press(r.getByText('Retry'));
    await waitFor(() => r.getByText(`${REGION.name} · Season 5`));
  });

  test('page bottom padding clears the Guide button', async () => {
    setup();
    const r = render(<RegisterScreen />);
    await waitFor(() => r.getByText(`${REGION.name} · Season 5`));
    const { guideFabClearanceStack } = require('../../components/ui/metrics');
    const content = r.getByTestId('screen-content');
    expect(StyleSheet.flatten(content.props.style).paddingBottom).toBeGreaterThanOrEqual(guideFabClearanceStack(0));
  });

  test('a pending action shows a busy button', async () => {
    setup();
    let resolvePost;
    mockPost.mockReturnValue(new Promise((res) => { resolvePost = res; }));
    const r = render(<RegisterScreen />);
    await waitFor(() => r.getByLabelText(/I accept the published/));
    fireEvent.press(r.getByLabelText(/I accept the published/));
    fireEvent.press(r.getByLabelText('Register my club'));
    await waitFor(() => expect(r.getByLabelText('Register my club').props.accessibilityState.busy).toBe(true));
    await act(async () => { resolvePost({}); });
  });

  test('Live Dark keeps the page transparent', async () => {
    useTheme('theme-video');
    setup();
    const r = render(<RegisterScreen />);
    await waitFor(() => r.getByText(`${REGION.name} · Season 5`));
    const flat = r.UNSAFE_root.findAll(() => true).map((n) => StyleSheet.flatten(n.props?.style)).filter(Boolean);
    expect(flat.some((s) => s.backgroundColor === '#03153F')).toBe(false);
  });
});
