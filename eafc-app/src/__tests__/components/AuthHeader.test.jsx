import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import AuthHeader from '../../components/auth/AuthHeader';

const mockRouter = { back: jest.fn(), replace: jest.fn(), canGoBack: jest.fn() };

jest.mock('expo-router', () => ({
  useRouter: () => mockRouter,
}));

jest.mock('@expo/vector-icons/Ionicons', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return { __esModule: true, default: ({ name }) => React.createElement(Text, null, name) };
});

describe('AuthHeader back button', () => {
  beforeEach(() => {
    mockRouter.back.mockClear();
    mockRouter.replace.mockClear();
  });

  test('goes back when there is history', () => {
    mockRouter.canGoBack.mockReturnValue(true);
    const { getByLabelText } = render(<AuthHeader title="Log in" />);
    fireEvent.press(getByLabelText('Back'));
    expect(mockRouter.back).toHaveBeenCalledTimes(1);
    expect(mockRouter.replace).not.toHaveBeenCalled();
  });

  test('falls back to the welcome screen when there is nothing to go back to', () => {
    mockRouter.canGoBack.mockReturnValue(false);
    const { getByLabelText } = render(<AuthHeader title="Log in" />);
    fireEvent.press(getByLabelText('Back'));
    expect(mockRouter.back).not.toHaveBeenCalled();
    expect(mockRouter.replace).toHaveBeenCalledWith('/auth/welcome');
  });
});
