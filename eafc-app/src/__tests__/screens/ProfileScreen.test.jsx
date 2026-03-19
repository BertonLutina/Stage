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
  return ({ children, style }) => React.createElement(View, { style }, children);
});

describe('ProfileScreen Create Team button', () => {
  beforeEach(() => {
    mockPush.mockClear();
  });

  it('shows Create Team button when viewing own profile on Teams tab', async () => {
    const { getByText } = render(<ProfileScreen />);

    // Switch to Teams tab
    const teamsTab = getByText('Teams');
    fireEvent.press(teamsTab);

    const createButton = getByText('+ Create Team');
    expect(createButton).toBeTruthy();
  });

  it('navigates to /teams/createteamscreen when Create Team is pressed', async () => {
    const { getByText } = render(<ProfileScreen />);

    const teamsTab = getByText('Teams');
    fireEvent.press(teamsTab);

    const createButton = getByText('+ Create Team');
    fireEvent.press(createButton);

    expect(mockPush).toHaveBeenCalledWith('/teams/createteamscreen');
  });
});
