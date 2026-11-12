import React from 'react';
import { Linking } from 'react-native';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import useThemeStore from '../../store/themeStore';

const mockBack = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ back: mockBack, push: jest.fn() }) }));
jest.mock('expo-linear-gradient', () => {
  const ReactModule = require('react');
  const { View } = require('react-native');
  return { LinearGradient: ({ children, style }) => ReactModule.createElement(View, { style }, children) };
});

const mockResolve = jest.fn();
const mockPlayerUpdate = jest.fn(() => Promise.resolve({}));
jest.mock('../../api/stageClient', () => ({
  resolveMyPlayerAndClub: (...a) => mockResolve(...a),
  stageClient: { entities: { Player: { update: (...a) => mockPlayerUpdate(...a) } } },
}));

const mockPushStatus = jest.fn();
const mockSync = jest.fn();
jest.mock('../../lib/oneSignal', () => ({
  getNativePushStatus: (...a) => mockPushStatus(...a),
  syncOneSignalTags: (...a) => mockSync(...a),
}));

const mockToast = jest.fn();
jest.mock('../../utils/toast', () => ({ showToast: (...a) => mockToast(...a) }));

import NotificationSettingsScreen from '../../app/apps/notification-settings';
import { isChannelCategoryOn } from '../../lib/notificationTypes';

beforeEach(() => {
  jest.clearAllMocks();
  act(() => { useThemeStore.getState().setStageTheme('theme-dark'); });
  mockResolve.mockResolvedValue({ player: { id: 'p1', notification_settings: null } });
  mockPushStatus.mockResolvedValue({ configured: true, permission: true, optedIn: true });
  jest.spyOn(Linking, 'openSettings').mockImplementation(() => Promise.resolve());
});

async function renderScreen() {
  const utils = render(<NotificationSettingsScreen />);
  await utils.findByLabelText('Messages, In-app');
  return utils;
}

describe('Notification settings screen', () => {
  test('shows a row per real category with In-app, Push and Email checkboxes', async () => {
    const { getByLabelText, getByText } = await renderScreen();
    expect(getByText('In-app')).toBeTruthy();
    expect(getByText('Push')).toBeTruthy();
    expect(getByText('Email')).toBeTruthy();
    for (const cat of ['Messages', 'Contract offers', 'Match results', 'Tournaments']) {
      for (const col of ['In-app', 'Push', 'Email']) {
        expect(getByLabelText(`${cat}, ${col}`).props.accessibilityRole).toBe('checkbox');
      }
    }
  });

  test('reflects the saved settings', async () => {
    mockResolve.mockResolvedValue({
      player: { id: 'p1', notification_settings: JSON.stringify({ email: { messages: false } }) },
    });
    const { getByLabelText } = await renderScreen();
    expect(getByLabelText('Messages, Email').props.accessibilityState.checked).toBe(false);
    expect(getByLabelText('Messages, Push').props.accessibilityState.checked).toBe(true);
  });

  test('toggling does not save until Save is pressed', async () => {
    const { getByLabelText } = await renderScreen();
    fireEvent.press(getByLabelText('Messages, Push'));
    expect(getByLabelText('Messages, Push').props.accessibilityState.checked).toBe(false);
    expect(mockPlayerUpdate).not.toHaveBeenCalled();
  });

  test('Save writes In-app to web and mobile, and push/email separately', async () => {
    const { getByLabelText, findByLabelText } = await renderScreen();
    fireEvent.press(getByLabelText('Messages, In-app'));
    fireEvent.press(getByLabelText('Match results, Email'));
    fireEvent.press(getByLabelText('Save'));
    await waitFor(() => expect(mockPlayerUpdate).toHaveBeenCalledTimes(1));
    const [id, patch] = mockPlayerUpdate.mock.calls[0];
    expect(id).toBe('p1');
    const saved = patch.notification_settings;
    expect(isChannelCategoryOn(saved, 'web', 'messages')).toBe(false);
    expect(isChannelCategoryOn(saved, 'mobile', 'messages')).toBe(false);
    expect(isChannelCategoryOn(saved, 'push', 'messages')).toBe(true);
    expect(isChannelCategoryOn(saved, 'email', 'match_results')).toBe(false);
    expect(isChannelCategoryOn(saved, 'web', 'match_results')).toBe(true);
    expect(mockSync).toHaveBeenCalledWith(saved);
    expect(await findByLabelText('Saved')).toBeTruthy();
  });

  test('a failed save shows an error and keeps the choices', async () => {
    mockPlayerUpdate.mockRejectedValueOnce(new Error('nope'));
    const { getByLabelText, findByText } = await renderScreen();
    fireEvent.press(getByLabelText('Messages, Email'));
    fireEvent.press(getByLabelText('Save'));
    expect(await findByText('Could not save your notification settings')).toBeTruthy();
    expect(getByLabelText('Messages, Email').props.accessibilityState.checked).toBe(false);
  });

  test('sound row says Default and Play sound in the app toggle matches the mockup', async () => {
    const { getByText, getByLabelText } = await renderScreen();
    expect(getByText('Notification sound')).toBeTruthy();
    expect(getByText('Default')).toBeTruthy();
    expect(getByLabelText('Play sound in the app').props.accessibilityRole).toBe('switch');
  });

  test('the sound row opens the phone settings', async () => {
    const { getByLabelText } = await renderScreen();
    fireEvent.press(getByLabelText('Notification sound'));
    expect(Linking.openSettings).toHaveBeenCalled();
  });

  test('warns when push is off on the phone and links to phone settings', async () => {
    mockPushStatus.mockResolvedValue({ configured: true, permission: false, optedIn: false });
    const { findByText, getByLabelText } = await renderScreen();
    expect(await findByText('Push is off on this phone.')).toBeTruthy();
    fireEvent.press(getByLabelText('Open phone settings'));
    expect(Linking.openSettings).toHaveBeenCalled();
  });

  test('no warning when push is on', async () => {
    const { queryByText } = await renderScreen();
    await waitFor(() => expect(mockPushStatus).toHaveBeenCalled());
    expect(queryByText('Push is off on this phone.')).toBeNull();
  });

  test('says push is unavailable when the build is not configured', async () => {
    mockPushStatus.mockResolvedValue({ configured: false, permission: false, optedIn: false });
    const { findByText, queryByLabelText } = await renderScreen();
    expect(await findByText('Push is not available in this build.')).toBeTruthy();
    expect(queryByLabelText('Open phone settings')).toBeNull();
  });

  test('empty state when there is no player profile', async () => {
    mockResolve.mockResolvedValue({ player: null });
    const { findByText, queryByLabelText } = render(<NotificationSettingsScreen />);
    expect(await findByText('No player profile yet')).toBeTruthy();
    expect(queryByLabelText('Save')).toBeNull();
  });

  test('error state with Retry', async () => {
    mockResolve.mockRejectedValueOnce(new Error('boom'));
    const { findByText, getByText, findByLabelText } = render(<NotificationSettingsScreen />);
    expect(await findByText('boom')).toBeTruthy();
    fireEvent.press(getByText('Retry'));
    expect(await findByLabelText('Messages, In-app')).toBeTruthy();
  });

  test('shows skeletons first and the back button goes back', async () => {
    const { getByTestId, getByLabelText, findByLabelText } = render(<NotificationSettingsScreen />);
    expect(getByTestId('skeleton-list')).toBeTruthy();
    await findByLabelText('Messages, In-app');
    fireEvent.press(getByLabelText('Back'));
    expect(mockBack).toHaveBeenCalled();
  });
});
