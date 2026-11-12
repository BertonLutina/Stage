import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import useThemeStore from '../../store/themeStore';

jest.setTimeout(30000);

const mockBack = jest.fn();
const mockReplace = jest.fn();
const mockPush = jest.fn();
let mockParams = {};
jest.mock('expo-router', () => ({
  useRouter: () => ({
    back: (...a) => mockBack(...a),
    replace: (...a) => mockReplace(...a),
    push: (...a) => mockPush(...a),
    canGoBack: () => true,
  }),
  useLocalSearchParams: () => mockParams,
}));
jest.mock('expo-linear-gradient', () => {
  const ReactModule = require('react');
  const { View } = require('react-native');
  return { LinearGradient: ({ children, style }) => ReactModule.createElement(View, { style }, children) };
});

const mockPost = jest.fn();
const mockGet = jest.fn();
jest.mock('../../api/stageClient', () => ({
  stageClient: { http: { post: (...a) => mockPost(...a), get: (...a) => mockGet(...a) } },
}));

const Forgot = require('../../app/auth/forgotpassword').default;
const Reset = require('../../app/auth/resetpassword').default;

beforeEach(() => {
  jest.clearAllMocks();
  mockParams = {};
  mockPost.mockResolvedValue({ ok: true });
  act(() => { useThemeStore.getState().setStageTheme('theme-dark'); });
});

describe('Forgot password screen', () => {
  test('shows the title, intro and an email field; no confirmation card yet', () => {
    const { getByText, getByLabelText, queryByText } = render(<Forgot />);
    expect(getByText('Forgot password')).toBeTruthy();
    expect(getByText(/We send you a link to choose a new password/)).toBeTruthy();
    expect(getByLabelText('Email')).toBeTruthy();
    expect(queryByText('Check your inbox')).toBeNull();
  });

  test('refuses an invalid email without calling the server', async () => {
    const { getByLabelText, findByText } = render(<Forgot />);
    fireEvent.changeText(getByLabelText('Email'), 'not-an-email');
    fireEvent.press(getByLabelText('Send the link'));
    expect(await findByText('Enter a valid email address')).toBeTruthy();
    expect(mockPost).not.toHaveBeenCalled();
  });

  test('posts the email as the identifier, then shows the inbox card', async () => {
    const { getByLabelText, findByText } = render(<Forgot />);
    fireEvent.changeText(getByLabelText('Email'), '  Kaze@Example.com ');
    fireEvent.press(getByLabelText('Send the link'));
    expect(await findByText('Check your inbox')).toBeTruthy();
    expect(mockPost).toHaveBeenCalledWith('/auth/forgot-password', { identifier: 'Kaze@Example.com' });
  });

  test('the card never says whether the account exists', async () => {
    const { getByLabelText, findByText } = render(<Forgot />);
    fireEvent.changeText(getByLabelText('Email'), 'kaze@example.com');
    fireEvent.press(getByLabelText('Send the link'));
    expect(await findByText(/If an account exists for this email/)).toBeTruthy();
  });

  test('resend is locked behind a 60 second countdown, then sends again', async () => {
    jest.useFakeTimers();
    try {
      const { getByLabelText, findByText, getByText, queryByLabelText } = render(<Forgot />);
      fireEvent.changeText(getByLabelText('Email'), 'kaze@example.com');
      await act(async () => { fireEvent.press(getByLabelText('Send the link')); });
      expect(await findByText('Resend in 1:00')).toBeTruthy();
      expect(queryByLabelText('Resend')).toBeNull();
      for (let i = 0; i < 12; i += 1) await act(async () => { jest.advanceTimersByTime(1000); });
      expect(getByText('Resend in 0:48')).toBeTruthy();
      for (let i = 0; i < 48; i += 1) await act(async () => { jest.advanceTimersByTime(1000); });
      fireEvent.press(getByLabelText('Resend'));
      await act(async () => {});
      expect(mockPost).toHaveBeenCalledTimes(2);
      expect(getByText('Resend in 1:00')).toBeTruthy();
    } finally {
      jest.useRealTimers();
    }
  });

  test('a network failure shows an error and keeps the form usable', async () => {
    mockPost.mockRejectedValueOnce(new Error('offline'));
    const { getByLabelText, findByText, queryByText } = render(<Forgot />);
    fireEvent.changeText(getByLabelText('Email'), 'kaze@example.com');
    fireEvent.press(getByLabelText('Send the link'));
    expect(await findByText('Could not send the link. Check your connection and try again.')).toBeTruthy();
    expect(queryByText('Check your inbox')).toBeNull();
    fireEvent.press(getByLabelText('Send the link'));
    expect(await findByText('Check your inbox')).toBeTruthy();
  });

  test('Remembered it? Sign in goes back to the login screen', () => {
    const { getByLabelText } = render(<Forgot />);
    fireEvent.press(getByLabelText('Sign in'));
    expect(mockReplace).toHaveBeenCalledWith('/auth/loginscreen');
  });
});

describe('Reset password screen', () => {
  beforeEach(() => {
    mockParams = { token: 'abc123' };
    mockGet.mockResolvedValue({ valid: true });
  });

  test('checks the token first, with a loading state', async () => {
    const { getByTestId, findByLabelText } = render(<Reset />);
    expect(getByTestId('skeleton-list')).toBeTruthy();
    await findByLabelText('New password');
    expect(mockGet).toHaveBeenCalledWith('/auth/reset-password', { token: 'abc123' });
  });

  test('an expired or used link explains it and offers a new one', async () => {
    mockGet.mockResolvedValue({ valid: false });
    const { findByText, getByLabelText, queryByLabelText } = render(<Reset />);
    expect(await findByText('This link no longer works')).toBeTruthy();
    expect(queryByLabelText('New password')).toBeNull();
    fireEvent.press(getByLabelText('Request a new link'));
    expect(mockReplace).toHaveBeenCalledWith('/auth/forgotpassword');
  });

  test('a missing token is treated as an invalid link without calling the server', async () => {
    mockParams = {};
    const { findByText } = render(<Reset />);
    expect(await findByText('This link no longer works')).toBeTruthy();
    expect(mockGet).not.toHaveBeenCalled();
  });

  test('failing to check the token shows an error with Retry', async () => {
    mockGet.mockRejectedValueOnce(new Error('offline'));
    const { findByText, getByText, findByLabelText } = render(<Reset />);
    expect(await findByText('offline')).toBeTruthy();
    fireEvent.press(getByText('Retry'));
    expect(await findByLabelText('New password')).toBeTruthy();
  });

  test('validates length and confirmation before posting', async () => {
    const { findByLabelText, getByLabelText, findByText, getByText } = render(<Reset />);
    fireEvent.changeText(await findByLabelText('New password'), 'short');
    fireEvent.changeText(getByLabelText('Confirm password'), 'short');
    fireEvent.press(getByLabelText('Save password'));
    expect(await findByText('At least 8 characters')).toBeTruthy();
    fireEvent.changeText(getByLabelText('New password'), 'longenough1');
    fireEvent.changeText(getByLabelText('Confirm password'), 'different1');
    fireEvent.press(getByLabelText('Save password'));
    expect(await findByText('Passwords do not match')).toBeTruthy();
    expect(mockPost).not.toHaveBeenCalled();
  });

  test('posts the token and the new password, then offers Sign in', async () => {
    const { findByLabelText, getByLabelText, findByText } = render(<Reset />);
    fireEvent.changeText(await findByLabelText('New password'), 'longenough1');
    fireEvent.changeText(getByLabelText('Confirm password'), 'longenough1');
    fireEvent.press(getByLabelText('Save password'));
    expect(await findByText('Password updated')).toBeTruthy();
    expect(mockPost).toHaveBeenCalledWith('/auth/reset-password', { token: 'abc123', password: 'longenough1' });
    fireEvent.press(getByLabelText('Sign in'));
    expect(mockReplace).toHaveBeenCalledWith('/auth/loginscreen');
  });

  test('a token rejected on submit shows the invalid-link state', async () => {
    mockPost.mockRejectedValueOnce({ status: 400, message: 'invalid_token' });
    const { findByLabelText, getByLabelText, findByText } = render(<Reset />);
    fireEvent.changeText(await findByLabelText('New password'), 'longenough1');
    fireEvent.changeText(getByLabelText('Confirm password'), 'longenough1');
    fireEvent.press(getByLabelText('Save password'));
    expect(await findByText('This link no longer works')).toBeTruthy();
  });

  test('another failure keeps the form and shows an error', async () => {
    mockPost.mockRejectedValueOnce({ status: 500, message: 'boom' });
    const { findByLabelText, getByLabelText, findByText } = render(<Reset />);
    fireEvent.changeText(await findByLabelText('New password'), 'longenough1');
    fireEvent.changeText(getByLabelText('Confirm password'), 'longenough1');
    fireEvent.press(getByLabelText('Save password'));
    expect(await findByText('Could not change your password. Try again.')).toBeTruthy();
    expect(getByLabelText('New password')).toBeTruthy();
  });
});
