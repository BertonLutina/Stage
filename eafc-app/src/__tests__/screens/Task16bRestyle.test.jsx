import React from 'react';
import { StyleSheet } from 'react-native';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import useThemeStore from '../../store/themeStore';

jest.setTimeout(30000);

const mockBack = jest.fn();
const mockPush = jest.fn();
const mockLoadClubProfile = jest.fn();
const mockResolve = jest.fn();
let mockPathname = '/apps/club/c1';
let mockParams = { id: 'c1' };

jest.mock('expo-router', () => ({
  useRouter: () => ({ back: (...a) => mockBack(...a), push: (...a) => mockPush(...a), canGoBack: () => true }),
  useLocalSearchParams: () => mockParams,
  usePathname: () => mockPathname,
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
  stageClient: {
    entities: {},
    http: { get: jest.fn(() => Promise.resolve({})), post: jest.fn(), patch: jest.fn() },
  },
}));
jest.mock('../../lib/clubProfileData', () => ({
  loadClubProfile: (...a) => mockLoadClubProfile(...a),
}));
jest.mock('../../components/profile/FollowToggleButton', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return ({ hidden }) => (hidden ? null : React.createElement(Text, null, 'Follow'));
});
const mockTabsProps = jest.fn();
jest.mock('../../app/(tabs)/profile/clubProfileTabs', () => (props) => {
  mockTabsProps(props);
  return null;
});

const ClubScreen = require('../../app/apps/club/[id]').default;
const PageWalkthrough = require('../../components/onboarding/PageWalkthrough').default;
const { guideFabBottom, guideFabClearance, guideFabBottomStack, guideFabClearanceStack, MIN_TOUCH } = require('../../components/ui/metrics');
const { getPageWalkthrough } = require('../../lib/pageWalkthroughs');

const STAGE_BG = '#03153F';
const flush = () => act(async () => { await new Promise((r) => setTimeout(r, 0)); });

function useTheme(id) {
  const store = {};
  global.localStorage = {
    getItem: (key) => (Object.prototype.hasOwnProperty.call(store, key) ? store[key] : null),
    setItem: (key, value) => { store[String(key)] = String(value); },
    removeItem: (key) => { delete store[String(key)]; },
  };
  useThemeStore.getState().setStageTheme(id);
}

function styles(root) {
  const out = [];
  const walk = (node) => {
    if (!node) return;
    if (node.props && node.props.style) out.push(StyleSheet.flatten(node.props.style));
    (node.children || []).forEach((c) => typeof c === 'object' && walk(c));
  };
  walk(root.toJSON());
  return out;
}

const BUNDLE = {
  club: { id: 'c1', name: 'Red Foxes', tag: 'RDF', platform: 'ps5' },
  president: { id: 'p1', display_name: 'Boss' },
  record: { wins: 5, draws: 2, losses: 3, totalGames: 10, winRate: 50 },
  players: [{ id: 'a' }, { id: 'b' }],
  trophies: [{ id: 't' }],
  matches: [],
  upcomingMatches: [],
  posts: [],
};

describe('Club app screen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLoadClubProfile.mockReset();
    mockParams = { id: 'c1' };
    mockResolve.mockResolvedValue({ presidentClub: null });
    useTheme('theme-dark');
  });

  test('loading shows only a spinner on the Stage background', async () => {
    mockLoadClubProfile.mockReturnValue(new Promise(() => {}));
    const r = render(<ClubScreen />);
    expect(r.queryByText('Club not found')).toBeNull();
    expect(styles(r).some((s) => s.backgroundColor === STAGE_BG)).toBe(true);
  });

  test('not found renders the muted message', async () => {
    mockLoadClubProfile.mockResolvedValue(null);
    const r = render(<ClubScreen />);
    await waitFor(() => r.getByText('Club not found'));
    const text = styles(r).find((s) => s.fontSize === 15 && s.textAlign === 'center');
    expect(text.color).toBe('#9FB3D1');
  });

  test('missing id also ends in not found without loading', async () => {
    mockParams = {};
    const r = render(<ClubScreen />);
    await waitFor(() => r.getByText('Club not found'));
    expect(mockLoadClubProfile).not.toHaveBeenCalled();
  });

  test('loaded club: hero, stat card, tabs as non-member, 20 gutter, back works', async () => {
    mockLoadClubProfile.mockResolvedValue(BUNDLE);
    const r = render(<ClubScreen />);
    await waitFor(() => r.getByText('Red Foxes'));
    expect(r.getByTestId('stat-row-0')).toBeTruthy();
    expect(r.getByText('Record')).toBeTruthy();
    expect(r.getByText('Squad')).toBeTruthy();
    expect(r.getByText('Trophies')).toBeTruthy();
    expect(mockTabsProps).toHaveBeenCalled();
    const props = mockTabsProps.mock.calls[0][0];
    expect(props.isOwner).toBe(false);
    expect(props.isMember).toBe(false);
    expect(props.players).toHaveLength(2);
    expect(styles(r).some((s) => s.paddingHorizontal === 20 && s.gap === 14)).toBe(true);
    fireEvent.press(r.getByLabelText('Back'));
    expect(mockBack).toHaveBeenCalled();
  });

  test('club president can challenge and follow a public club', async () => {
    mockResolve.mockResolvedValue({ presidentClub: { id: 'own-club' } });
    mockLoadClubProfile.mockResolvedValue(BUNDLE);
    const r = render(<ClubScreen />);
    await waitFor(() => r.getByLabelText('Challenge'));
    expect(r.getByText('Follow')).toBeTruthy();
    fireEvent.press(r.getByLabelText('Challenge'));
    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/(tabs)/matches',
      params: expect.objectContaining({
        arrange: '1', opponentKind: 'club', opponentId: 'c1', opponentName: 'Red Foxes',
      }),
    });
  });

  test('load errors expose retry and recover', async () => {
    mockLoadClubProfile
      .mockRejectedValueOnce(new Error('Club unavailable'))
      .mockResolvedValueOnce(BUNDLE);
    const r = render(<ClubScreen />);
    await waitFor(() => r.getByText('Club unavailable'));
    fireEvent.press(r.getByText('Try again'));
    await waitFor(() => r.getByText('Red Foxes'));
  });

  test('real zero-filled shapes (failed fetches) hide the stat card instead of showing 0', async () => {
    mockLoadClubProfile.mockResolvedValue({
      ...BUNDLE,
      record: { wins: 0, draws: 0, losses: 0, totalGames: 0, winRate: 0 },
      players: [],
      trophies: [],
    });
    const r = render(<ClubScreen />);
    await waitFor(() => r.getByText('Red Foxes'));
    expect(r.queryByText('Record')).toBeNull();
    expect(r.queryByText('Squad')).toBeNull();
    expect(r.queryByText('Trophies')).toBeNull();
    expect(r.queryByTestId('stat-row-0')).toBeNull();
  });

  test('only populated stats are shown', async () => {
    mockLoadClubProfile.mockResolvedValue({
      ...BUNDLE,
      record: { wins: 0, draws: 0, losses: 0, totalGames: 0, winRate: 0 },
      trophies: [],
    });
    const r = render(<ClubScreen />);
    await waitFor(() => r.getByText('Red Foxes'));
    expect(r.getByText('Squad')).toBeTruthy();
    expect(r.queryByText('Record')).toBeNull();
    expect(r.queryByText('Trophies')).toBeNull();
  });

  test('scroll content clears the global Guide button', async () => {
    mockLoadClubProfile.mockResolvedValue(BUNDLE);
    const r = render(<ClubScreen />);
    await waitFor(() => r.getByText('Red Foxes'));
    const { UNSAFE_getByType } = r;
    const { ScrollView } = require('react-native');
    const pad = StyleSheet.flatten(UNSAFE_getByType(ScrollView).props.contentContainerStyle).paddingBottom;
    // Derived from the shared helper, so the FAB position and the page clearance cannot drift.
    expect(pad).toBeGreaterThanOrEqual(guideFabClearanceStack(0));
  });

  test('Live Dark keeps the screen transparent over the wallpaper', async () => {
    useTheme('theme-video');
    mockLoadClubProfile.mockResolvedValue(BUNDLE);
    const r = render(<ClubScreen />);
    await waitFor(() => r.getByText('Red Foxes'));
    expect(styles(r).some((s) => s.backgroundColor === STAGE_BG)).toBe(false);
  });
});

describe('Registration status pill', () => {
  beforeEach(() => {
    useTheme('theme-dark');
  });

  test('status tones: approved success, rejected/ended danger, pending/waitlisted warning', () => {
    const { registrationTone } = require('../../components/apps/RegistrationStatusPill');
    expect(registrationTone('approved')).toBe('success');
    expect(registrationTone('APPROVED')).toBe('success');
    ['rejected', 'removed', 'withdrawn', 'cancelled', 'canceled'].forEach((status) => {
      expect(registrationTone(status)).toBe('danger');
    });
    ['pending', 'waitlisted', '', undefined].forEach((status) => {
      expect(registrationTone(status)).toBe('warning');
    });
    const Pill = require('../../components/apps/RegistrationStatusPill').default;
    const tokens = useThemeStore.getState().tokens;
    const rejected = render(<Pill status="rejected" />);
    const flatRejected = StyleSheet.flatten(rejected.getByLabelText('Application status: REJECTED').props.style);
    expect(flatRejected.backgroundColor).toBe(tokens.dangerBg);
    expect(flatRejected.borderColor).toBe(tokens.danger);
    expect(StyleSheet.flatten(rejected.getByText('REJECTED').props.style).color).toBe(tokens.danger);
  });
});

describe('guide button clearance helpers', () => {
  test('the page clearance is the button position plus its height and breathing room', () => {
    expect(guideFabBottom(0)).toBe(24 + 64 + 16);
    [0, 10, 24, 34].forEach((inset) => {
      expect(guideFabClearance(inset)).toBe(guideFabBottom(inset) + MIN_TOUCH + 16);
    });
    // the home-indicator inset wins once it exceeds the 24px tab bar gap
    expect(guideFabBottom(34)).toBe(34 + 64 + 16);
    expect(guideFabBottom(10)).toBe(guideFabBottom(0));
  });

  test('stack screens clear the button without the tab bar offset', () => {
    expect(guideFabBottomStack(0)).toBe(24);
    expect(guideFabBottomStack(34)).toBe(34);
    [0, 10, 34].forEach((inset) => {
      expect(guideFabClearanceStack(inset)).toBe(guideFabBottomStack(inset) + MIN_TOUCH + 16);
      expect(guideFabClearanceStack(inset)).toBeLessThan(guideFabClearance(inset));
    });
  });

  test('the Guide button follows the home-indicator inset through the shared helper', () => {
    mockPathname = '/apps/register';
    const safe = require('react-native-safe-area-context');
    const spy = jest.spyOn(safe, 'useSafeAreaInsets').mockReturnValue({ top: 0, bottom: 34, left: 0, right: 0 });
    try {
      const guide = getPageWalkthrough('/apps/register', 'en');
      const r = render(<PageWalkthrough />);
      const flat = StyleSheet.flatten(r.getByLabelText(`Open ${guide.label} guide`).props.style);
      expect(flat.bottom).toBe(guideFabBottomStack(34));
    } finally {
      spy.mockRestore();
    }
  });
});

describe('PageWalkthrough', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useTheme('theme-dark');
    mockPathname = '/apps/register';
  });

  test('hidden on routes with no guide and on onboarding', () => {
    mockPathname = '/auth/onboarding';
    expect(render(<PageWalkthrough />).toJSON()).toBeNull();
    mockPathname = '/apps/settings';
    expect(render(<PageWalkthrough />).toJSON()).toBeNull();
    mockPathname = '/nowhere';
    expect(render(<PageWalkthrough />).toJSON()).toBeNull();
  });

  test('shows the Guide button, clear of the tab bar and above content', () => {
    const guide = getPageWalkthrough('/apps/register', 'en');
    const r = render(<PageWalkthrough />);
    const btn = r.getByLabelText(`Open ${guide.label} guide`);
    const flat = StyleSheet.flatten(btn.props.style);
    expect(flat.zIndex).toBe(40);
    expect(flat.minHeight).toBeGreaterThanOrEqual(44);
    // /apps/* are stack pages without a tab bar, so the button sits at the bottom safe edge
    expect(flat.bottom).toBe(guideFabBottomStack(0));
    expect(flat.bottom).toBe(24);
    expect(flat.backgroundColor).toBe('#132B5C');
    expect(flat.borderRadius).toBe(14);
    expect(r.getByText('GUIDE')).toBeTruthy();
  });

  test('opens a sheet listing every step, then closes via Got it, X and backdrop', () => {
    const guide = getPageWalkthrough('/apps/register', 'en');
    const r = render(<PageWalkthrough />);
    fireEvent.press(r.getByLabelText(`Open ${guide.label} guide`));
    guide.steps.forEach((step, i) => {
      expect(r.getByText(step)).toBeTruthy();
      expect(r.getAllByText(String(i + 1)).length).toBeGreaterThan(0);
    });
    expect(r.getByText(`${guide.steps.length} steps on this path`)).toBeTruthy();
    expect(r.queryByLabelText(`Open ${guide.label} guide`)).toBeNull();

    fireEvent.press(r.getByText('GOT IT'));
    expect(r.getByLabelText(`Open ${guide.label} guide`)).toBeTruthy();

    fireEvent.press(r.getByLabelText(`Open ${guide.label} guide`));
    fireEvent.press(r.getByLabelText('Close guide'));
    expect(r.getByLabelText(`Open ${guide.label} guide`)).toBeTruthy();

    fireEvent.press(r.getByLabelText(`Open ${guide.label} guide`));
    fireEvent.press(r.getByLabelText('Dismiss guide'));
    expect(r.getByLabelText(`Open ${guide.label} guide`)).toBeTruthy();
  });

  test('sheet uses Stage card tokens and a closed sheet resets on route change', () => {
    const guide = getPageWalkthrough('/apps/register', 'en');
    const r = render(<PageWalkthrough />);
    fireEvent.press(r.getByLabelText(`Open ${guide.label} guide`));
    const all = styles(r);
    expect(all.some((s) => s.backgroundColor === '#132B5C' && s.borderTopLeftRadius === 16)).toBe(true);
    expect(all.some((s) => s.backgroundColor === '#07163A' && s.borderRadius === 16)).toBe(true);
    mockPathname = '/apps/club/c1';
    r.rerender(<PageWalkthrough />);
    expect(r.queryByText('GOT IT')).toBeNull();
  });

  test('Live Dark: sheet and step rows stay translucent', () => {
    useTheme('theme-video');
    const guide = getPageWalkthrough('/apps/register', 'en');
    const r = render(<PageWalkthrough />);
    fireEvent.press(r.getByLabelText(`Open ${guide.label} guide`));
    const all = styles(r);
    expect(all.some((s) => s.borderTopLeftRadius === 16 && /^rgba/.test(String(s.backgroundColor)))).toBe(true);
    expect(all.some((s) => s.borderRadius === 16 && s.padding === 14 && /^rgba/.test(String(s.backgroundColor)))).toBe(true);
  });
});
