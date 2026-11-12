import React from 'react';
import { StyleSheet } from 'react-native';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import useThemeStore from '../../store/themeStore';

jest.setTimeout(30000);

const mockBack = jest.fn();
const mockPush = jest.fn();
const mockCreateTeam = jest.fn();
const mockLoadClubProfile = jest.fn();
let mockParams = { teamId: 't1' };

jest.mock('expo-router', () => ({
  useRouter: () => ({ back: (...a) => mockBack(...a), push: (...a) => mockPush(...a), canGoBack: () => true }),
  useLocalSearchParams: () => mockParams,
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
jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'denied' })),
  launchImageLibraryAsync: jest.fn(),
  MediaTypeOptions: { Images: 'Images' },
}));
jest.mock('../../store/teamStore', () => ({
  __esModule: true,
  default: () => ({ createTeam: (...a) => mockCreateTeam(...a) }),
}));
jest.mock('../../api/stageClient', () => ({
  resolveMyPlayerAndClub: jest.fn(() => Promise.resolve({ player: null })),
  stageClient: {
    entities: { MatchPlayerStat: { filter: jest.fn(() => Promise.resolve([])) } },
    http: { get: jest.fn(() => Promise.resolve({})), post: jest.fn(), patch: jest.fn() },
  },
}));
jest.mock('../../lib/clubProfileData', () => {
  const actual = jest.requireActual('../../lib/clubProfileData');
  return { ...actual, loadClubProfile: (...a) => mockLoadClubProfile(...a) };
});
jest.mock('../../components/profile/FollowToggleButton', () => () => null);
jest.mock('../../app/(tabs)/profile/clubProfileTabs', () => () => null);

const CreateTeamScreen = require('../../app/teams/createteamscreen').default;
const TeamProfileScreen = require('../../app/teams/teamprofilescreen').default;
const ClubHero = require('../../components/club/ClubHero').default;
const ClubIdentityCard = require('../../components/club/ClubIdentityCard').default;
const ClubOfficePanel = require('../../components/club/ClubOfficePanel').default;
const ClubFixturesPanel = require('../../components/club/ClubFixturesPanel').default;
const SquadPlayerCard = require('../../components/club/SquadPlayerCard').default;

const STAGE_BG = '#03153F';

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

describe('Teams restyle', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockParams = { teamId: 't1' };
    useTheme('theme-dark');
  });

  describe('CreateTeamScreen', () => {
    it('validates the club name before submitting', () => {
      const { getByLabelText, getByText } = render(<CreateTeamScreen navigation={{ replace: jest.fn() }} />);
      fireEvent.press(getByLabelText('Create Team'));
      expect(getByText('Club name is required')).toBeTruthy();
      expect(mockCreateTeam).not.toHaveBeenCalled();
    });

    it('submits the form fields and navigates to the new team', async () => {
      const replace = jest.fn();
      mockCreateTeam.mockResolvedValue({ id: 'new-1' });
      const { getByLabelText } = render(<CreateTeamScreen navigation={{ replace }} />);
      fireEvent.changeText(getByLabelText('Club Name *'), 'FC Test');
      fireEvent.changeText(getByLabelText('Tag'), 'FCT');
      fireEvent.changeText(getByLabelText('Country'), 'Belgium');
      fireEvent.changeText(getByLabelText('Country Code'), 'BE');
      fireEvent.changeText(getByLabelText('Bio'), 'Hello');
      fireEvent.press(getByLabelText('Create Team'));
      await waitFor(() => expect(mockCreateTeam).toHaveBeenCalledWith({
        club_name: 'FC Test',
        tag: 'FCT',
        country: 'Belgium',
        country_code: 'BE',
        bio: 'Hello',
        primary_color: '#5FE3E8',
        open_to_applications: '1',
      }));
      await waitFor(() => expect(replace).toHaveBeenCalledWith('TeamProfile', { teamId: 'new-1' }));
    });

    it('keeps player discovery real instead of pretending an invite was sent', () => {
      const { getByText } = render(<CreateTeamScreen navigation={{ replace: jest.fn() }} />);
      expect(getByText('Invite players')).toBeTruthy();
      fireEvent.press(getByText('+ Add player'));
      expect(mockPush).toHaveBeenCalledWith('/(tabs)/search/searchplayer');
    });

    it('shows the API error and closes with back', async () => {
      mockCreateTeam.mockRejectedValue({ response: { data: { message: 'Name taken' } } });
      const { getByLabelText, findByText } = render(<CreateTeamScreen navigation={{ replace: jest.fn() }} />);
      fireEvent.changeText(getByLabelText('Club Name *'), 'FC Test');
      fireEvent.press(getByLabelText('Create Team'));
      expect(await findByText('Name taken')).toBeTruthy();
      fireEvent.press(getByLabelText('Close'));
      expect(mockBack).toHaveBeenCalled();
    });

    it('keeps the logo picker reachable and paints the Stage background', () => {
      const tree = render(<CreateTeamScreen navigation={{ replace: jest.fn() }} />);
      expect(tree.getByLabelText('Team logo')).toBeTruthy();
      expect(styles(tree).some((s) => s.backgroundColor === STAGE_BG)).toBe(true);
    });
  });

  describe('TeamProfileScreen', () => {
    it('shows club not found when the bundle has no club', async () => {
      mockLoadClubProfile.mockResolvedValue({ club: null });
      const { findByText } = render(<TeamProfileScreen />);
      expect(await findByText('Club not found')).toBeTruthy();
    });

    it('renders the hero and a stat card from the loaded bundle', async () => {
      mockLoadClubProfile.mockResolvedValue({
        club: { id: 't1', name: 'Night Owls', tag: 'NOW', platform: 'ps5', region: 'EU', created_date: '2025-04-01' },
        players: [{ id: 'p1' }, { id: 'p2' }],
        record: { wins: 24, draws: 1, losses: 2, totalGames: 27, winRate: 89 },
        trophies: [{ id: 'x' }],
        president: null,
      });
      const { findByText, getByText, getAllByText } = render(<TeamProfileScreen />);
      expect(await findByText('Night Owls')).toBeTruthy();
      expect(getByText('24-1-2')).toBeTruthy();
      expect(getByText('Record')).toBeTruthy();
      expect(getByText('Squad')).toBeTruthy();
      expect(getByText('Trophies')).toBeTruthy();
      expect(getAllByText('2').length).toBeGreaterThan(0);
      expect(getByText('Founded 2025')).toBeTruthy();
    });

    it('hides zero-filled stats from failed fetches instead of showing 0', async () => {
      mockLoadClubProfile.mockResolvedValue({
        club: { id: 't1', name: 'Night Owls', tag: 'NOW', platform: 'ps5' },
        players: [],
        record: { wins: 0, draws: 0, losses: 0, totalGames: 0, winRate: 0 },
        trophies: [],
        president: null,
      });
      const { findByText, queryByText } = render(<TeamProfileScreen />);
      expect(await findByText('Night Owls')).toBeTruthy();
      expect(queryByText('Record')).toBeNull();
      expect(queryByText('Squad')).toBeNull();
      expect(queryByText('Trophies')).toBeNull();
    });

    it('shows only the stats that have data', async () => {
      mockLoadClubProfile.mockResolvedValue({
        club: { id: 't1', name: 'Night Owls', tag: 'NOW', platform: 'ps5' },
        players: [{ id: 'p1' }],
        record: { wins: 0, draws: 0, losses: 0, totalGames: 0, winRate: 0 },
        trophies: [],
        president: null,
      });
      const { findByText, queryByText } = render(<TeamProfileScreen />);
      expect(await findByText('Night Owls')).toBeTruthy();
      expect(queryByText('Squad')).toBeTruthy();
      expect(queryByText('Record')).toBeNull();
      expect(queryByText('Trophies')).toBeNull();
    });
  });

  describe('club components', () => {
    it('ClubHero keeps the back button and president shortcut', () => {
      const onBack = jest.fn();
      const onOpenPresident = jest.fn();
      const { getByLabelText, getByText } = render(
        <ClubHero
          club={{ name: 'Night Owls', tag: 'NOW', platform: 'ps5' }}
          president={{ display_name: 'Prez' }}
          record={{ winRate: 50 }}
          memberCount={3}
          onBack={onBack}
          onOpenPresident={onOpenPresident}
        />,
      );
      fireEvent.press(getByLabelText('Back'));
      expect(onBack).toHaveBeenCalled();
      fireEvent.press(getByText('Prez'));
      expect(onOpenPresident).toHaveBeenCalled();
    });

    it('ClubIdentityCard shows tag and win rate', () => {
      const { getByText } = render(<ClubIdentityCard tag="NOW" platform="ps5" winRate={71.4} />);
      expect(getByText('NOW')).toBeTruthy();
      expect(getByText('71')).toBeTruthy();
    });

    it('ClubOfficePanel opens a section and returns', () => {
      const { getByText, getByLabelText, queryByText } = render(<ClubOfficePanel contracts={[]} />);
      expect(getByText('Club Office')).toBeTruthy();
      const first = getByLabelText(/contracts/i);
      fireEvent.press(first);
      expect(getByText('No contracts yet')).toBeTruthy();
      const back = getByLabelText('Back to Club Office');
      expect(back.props.accessibilityRole).toBe('button');
      fireEvent.press(back);
      expect(queryByText('No contracts yet')).toBeNull();
      expect(getByText('Club Office')).toBeTruthy();
    });

    it('ClubFixturesPanel keeps the empty state', () => {
      const { getByText } = render(<ClubFixturesPanel clubId="c1" matches={[]} upcomingMatches={[]} />);
      expect(getByText('No fixtures yet')).toBeTruthy();
    });

    it('SquadPlayerCard opens the profile and the actions menu', () => {
      const onOpenProfile = jest.fn();
      const action = jest.fn();
      const { getByText, getByLabelText } = render(
        <SquadPlayerCard
          player={{ gamertag: 'NightOwl', position: 'ST', overall_rating: 88, platform: 'ps5' }}
          clubStats={{ goals: 4, assists: 2, matches: 9, avgRating: 7.4 }}
          contractSummary={{ key: 'active', label: 'Active Contract', color: 'x' }}
          availabilitySummary={{ key: 'no_response', label: 'No Response', color: 'x' }}
          menuActions={[{ label: 'Release player', onPress: action }]}
          onOpenProfile={onOpenProfile}
        />,
      );
      expect(getByText('NightOwl')).toBeTruthy();
      expect(getByText('Active Contract')).toBeTruthy();
      expect(getByLabelText('Player actions')).toBeTruthy();
      fireEvent.press(getByText('NightOwl'));
      expect(onOpenProfile).toHaveBeenCalled();
    });

    it('stays translucent in Live Dark', () => {
      useTheme('theme-video');
      const tree = render(<CreateTeamScreen navigation={{ replace: jest.fn() }} />);
      expect(styles(tree).some((s) => s.backgroundColor === STAGE_BG)).toBe(false);
    });
  });
});
