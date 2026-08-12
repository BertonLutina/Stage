import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
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
    const { getByText } = render(<ProfileScreen player={player} />);

    expect(getByText('Matches')).toBeTruthy();
    expect(getByText('Feed')).toBeTruthy();
    expect(getByText('Stats')).toBeTruthy();
    expect(getByText('More')).toBeTruthy();
  });

  it('opens the More tool list from the primary tab rail', () => {
    const { getByText } = render(<ProfileScreen player={player} />);

    fireEvent.press(getByText('More'));

    expect(getByText('Career')).toBeTruthy();
    expect(getByText('Showcase')).toBeTruthy();
    expect(getByText('Trophies')).toBeTruthy();
  });
});
