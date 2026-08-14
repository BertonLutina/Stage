import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import ProfileScreen from '../../app/(tabs)/profile/profilescreen';

const mockPush = jest.fn();
const mockBack = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, back: mockBack, replace: jest.fn() }),
  useLocalSearchParams: () => ({}),
}));

jest.mock('../../store/authStore', () => ({
  __esModule: true,
  default: () => ({
    user: { id: 'user-1', first_name: 'Test', last_name: 'User', gamer_tag: 'testuser' },
    logout: jest.fn(),
  }),
}));

jest.mock('../../utils/api', () => ({
  __esModule: true,
  default: { get: jest.fn(() => Promise.resolve({ data: { data: { teams: [], stats: {} } } })) },
}));

jest.mock('../../components/common/GradientBackground', () => {
  const React = require('react');
  const { View } = require('react-native');
  return ({ children }) => React.createElement(View, null, children);
});

jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: jest.fn(async () => ({ status: 'granted' })),
  launchImageLibraryAsync: jest.fn(async () => ({ canceled: true, assets: [] })),
  MediaTypeOptions: { Images: 'Images', Videos: 'Videos' },
}));

jest.mock('../../api/stageClient', () => ({
  stageClient: {
    entities: {
      Match: { filter: jest.fn(() => Promise.resolve([])) },
      Player: { update: jest.fn() },
      PlayerShowcaseVideo: { filter: jest.fn(() => Promise.resolve([])) },
    },
    clubs: { leave: jest.fn() },
    integrations: { Core: { UploadFile: jest.fn() } },
    http: { post: jest.fn() },
  },
  resolveMyPlayerAndClub: jest.fn(() => Promise.resolve({ user: null, player: null, club: null })),
}));

jest.mock('../../lib/leaveClub', () => ({
  leaveStageClub: jest.fn(),
}));

jest.mock('expo-linear-gradient', () => {
  const React = require('react');
  const { View } = require('react-native');
  const LinearGradient = ({ children, style }) => React.createElement(View, { style }, children);
  return { LinearGradient };
});

const player = {
  id: 'player-1',
  gamertag: 'testuser',
  country: 'Belgium',
  platform: 'PlayStation',
  position: 'ST',
};

describe('ProfileScreen tabs', () => {
  beforeEach(() => {
    mockPush.mockClear();
  });

  it('shows the current primary profile tabs for an own player profile', () => {
    const { getByText, queryByText } = render(<ProfileScreen player={player} />);

    expect(getByText('Feed')).toBeTruthy();
    expect(getByText('Showcase')).toBeTruthy();
    expect(getByText('More')).toBeTruthy();
    expect(queryByText('Matches')).toBeNull();
    expect(queryByText('Stats')).toBeNull();
  });

  it('opens the More tool list from the primary tab rail', () => {
    const { getByText } = render(<ProfileScreen player={player} />);

    fireEvent.press(getByText('More'));

    expect(getByText('Career')).toBeTruthy();
    expect(getByText('Trophies')).toBeTruthy();
  });

  it('shows the Showcase panel on the profile page', async () => {
    const { getByText } = render(<ProfileScreen player={player} />);

    fireEvent.press(getByText('Showcase'));

    await waitFor(() => {
      expect(getByText('Publish clips of how you play so clubs can find you. You own these — a scout can only watch them.')).toBeTruthy();
    });
  });

  it('keeps Dashboard and logout out of the player hero', () => {
    const { queryByText, getByLabelText } = render(<ProfileScreen player={player} />);

    expect(queryByText('Dashboard')).toBeNull();
    expect(queryByText('LEAVE')).toBeNull();
    expect(queryByText('Leave')).toBeNull();
    expect(getByLabelText('Edit')).toBeTruthy();
  });

  it('puts Leave club and Sign out under More', () => {
    const signedClub = { id: 'club-1', name: 'FC Congo' };
    const { getByText, queryByText } = render(
      <ProfileScreen player={{ ...player, club_id: 'club-1' }} signedClub={signedClub} />,
    );

    expect(queryByText('Leave club')).toBeNull();
    expect(queryByText('Sign out')).toBeNull();

    fireEvent.press(getByText('More'));

    expect(getByText('Leave club')).toBeTruthy();
    expect(getByText('Sign out')).toBeTruthy();
  });
});
