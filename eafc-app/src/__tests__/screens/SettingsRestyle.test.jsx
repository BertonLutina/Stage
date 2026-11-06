import React from 'react';
import { StyleSheet } from 'react-native';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import useThemeStore from '../../store/themeStore';

const mockBack = jest.fn();
const mockPush = jest.fn();
const mockReplace = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, back: mockBack, replace: mockReplace }),
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
jest.mock('expo-image-picker', () => ({
  launchImageLibraryAsync: jest.fn(),
  MediaTypeOptions: { Images: 'Images' },
}));

const mockLogout = jest.fn(() => Promise.resolve());
jest.mock('../../store/authStore', () => ({
  __esModule: true,
  default: (selector) => selector({ logout: mockLogout, user: { id: 'u1' } }),
}));

const mockMe = jest.fn();
const mockUpdateMe = jest.fn(() => Promise.resolve({}));
const mockUpdateTimezone = jest.fn(() => Promise.resolve({}));
const mockInvoke = jest.fn(() => Promise.resolve({}));
const mockPlayerUpdate = jest.fn(() => Promise.resolve({}));
const mockResolve = jest.fn();
jest.mock('../../api/stageClient', () => ({
  resolveMyPlayerAndClub: (...a) => mockResolve(...a),
  stageClient: {
    auth: {
      me: (...a) => mockMe(...a),
      updateMe: (...a) => mockUpdateMe(...a),
      updateTimezone: (...a) => mockUpdateTimezone(...a),
    },
    functions: { invoke: (...a) => mockInvoke(...a) },
    entities: { Player: { update: (...a) => mockPlayerUpdate(...a) } },
  },
}));

const mockBioState = { available: true, enabled: false };
const mockSetBiometricEnabled = jest.fn(() => Promise.resolve());
jest.mock('../../services/biometricAuthService', () => ({
  getBiometricEnabled: () => Promise.resolve(mockBioState.enabled),
  isBiometricAvailable: () => Promise.resolve(mockBioState.available),
  getSupportedBiometricKinds: () => Promise.resolve(['face']),
  setBiometricEnabled: (...a) => mockSetBiometricEnabled(...a),
  biometricPromptCopy: () => ({ settingsLabel: 'Face ID login' }),
}));

let mockPush2 = { configured: true, permission: true, optedIn: true };
const mockSetPush = jest.fn(() => Promise.resolve());
jest.mock('../../lib/oneSignal', () => ({
  getNativePushStatus: () => Promise.resolve(mockPush2),
  setNativePushEnabled: (...a) => mockSetPush(...a),
  syncOneSignalTags: jest.fn(),
}));

const mockToast = jest.fn();
jest.mock('../../utils/toast', () => ({ showToast: (...a) => mockToast(...a) }));
jest.mock('../../lib/discordConfig', () => ({ DISCORD_INVITE_URL: 'https://discord.example/invite' }));
jest.mock('../../components/onboarding/TutorialPopup', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return { __esModule: true, default: ({ open }) => (open ? React.createElement(Text, null, 'tutorial-open') : null) };
});
jest.mock('../../components/onboarding/ClubSetup', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return { __esModule: true, default: () => React.createElement(Text, null, 'club-setup') };
});
jest.mock('../../components/onboarding/PlayerSetup', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return { __esModule: true, default: () => React.createElement(Text, null, 'player-setup') };
});

const Settings = require('../../app/apps/settings').default;
const { Linking } = require('react-native');
const { writeAccountIntent } = require('../../lib/accountIntent');
const polyfillStorage = require('../../lib/polyfillStorage').localStorage;

const HEX = /#[0-9A-Fa-f]{6}\b/;
function strayHex(toJSON) {
  const seen = [];
  const walk = (node) => {
    if (!node || typeof node === 'string') return;
    if (node.props?.style) {
      const flat = StyleSheet.flatten(node.props.style) || {};
      Object.values(flat).forEach((v) => { if (typeof v === 'string' && HEX.test(v) && !seen.includes(v)) seen.push(v); });
    }
    (node.children || []).forEach(walk);
  };
  walk(toJSON());
  const tokens = useThemeStore.getState().tokens;
  const allowed = new Set(Object.values(tokens).filter((v) => typeof v === 'string'));
  return seen.filter((v) => !allowed.has(v));
}

/** An undefined style key would override a token default (lesson from the inbox restyle). */
function undefinedStyleKeys(toJSON) {
  const bad = [];
  const walk = (node) => {
    if (!node || typeof node === 'string') return;
    if (node.props?.style) {
      const flat = StyleSheet.flatten(node.props.style) || {};
      Object.entries(flat).forEach(([k, v]) => { if (v === undefined) bad.push(k); });
    }
    (node.children || []).forEach(walk);
  };
  walk(toJSON());
  return bad;
}

const flat = (node) => StyleSheet.flatten(node.props.style) || {};

function useTheme(id) {
  const store = {};
  global.localStorage = {
    getItem: (key) => (Object.prototype.hasOwnProperty.call(store, key) ? store[key] : null),
    setItem: (key, value) => { store[String(key)] = String(value); },
    removeItem: (key) => { delete store[String(key)]; },
  };
  useThemeStore.getState().setStageTheme(id);
}

const PLAYER = { id: 'p1', gamertag: 'Kaze', notification_settings: null };

async function renderSettings() {
  const utils = render(<Settings />);
  await utils.findByText('Store & wallet');
  return utils;
}

beforeEach(() => {
  jest.clearAllMocks();
  useTheme('theme-dark');
  polyfillStorage.setItem('stage-theme', 'theme-dark');
  polyfillStorage.setItem('language', 'en');
  mockBioState.available = true;
  mockBioState.enabled = false;
  mockPush2 = { configured: true, permission: true, optedIn: true };
  mockMe.mockResolvedValue({ language: 'en', timezone: 'Europe/Brussels' });
  mockResolve.mockResolvedValue({ user: { id: 'u1' }, player: PLAYER, presidentClub: { id: 'c1', name: 'Club' } });
});

describe('Settings screen', () => {
  test('shows a spinner while loading, then the header, sections and no stray colours', async () => {
    let release;
    mockMe.mockReturnValue(new Promise((r) => { release = r; }));
    const { queryByText, findByText, getByLabelText, toJSON } = render(<Settings />);
    expect(queryByText('Store & wallet')).toBeNull();
    await act(async () => { release({ language: 'en' }); });
    await findByText('Store & wallet');
    fireEvent.press(getByLabelText('Back'));
    expect(mockBack).toHaveBeenCalled();
    expect(strayHex(toJSON)).toEqual([]);
    expect(undefinedStyleKeys(toJSON)).toEqual([]);
  });

  test('the screen lifts the password fields above the keyboard through Screen (iOS padding)', async () => {
    const { Platform, KeyboardAvoidingView } = require('react-native');
    const original = Platform.OS;
    Platform.OS = 'ios';
    try {
      const { UNSAFE_getAllByType, getByText, getByLabelText } = await renderSettings();
      const avoiders = UNSAFE_getAllByType(KeyboardAvoidingView);
      expect(avoiders).toHaveLength(1);
      expect(avoiders[0].props.behavior).toBe('padding');
      // it wraps the page content (the title lives inside it), not just the dialog
      expect(avoiders[0].findAll((n) => n.props?.children === 'Settings').length).toBeGreaterThan(0);
      expect(getByText('Settings')).toBeTruthy();
      // opening the delete dialog adds its own avoider for the confirm input
      fireEvent.press(getByLabelText('Delete Account'));
      expect(UNSAFE_getAllByType(KeyboardAvoidingView)).toHaveLength(2);
    } finally {
      Platform.OS = original;
    }
  });

  test('the theme switch keeps its translated accessible group name', async () => {
    const { getByLabelText } = await renderSettings();
    const group = getByLabelText('App Theme');
    expect(group.props.accessibilityRole).toBe('radiogroup');
    // it is the segmented control that holds the Dark / Live Dark options
    expect(group.findAll((n) => n.props?.accessibilityLabel === 'LIVE DARK').length).toBeGreaterThan(0);
  });

  test('title is the 34px uppercase heading; section labels are muted 11px caps', async () => {
    const { getByText } = await renderSettings();
    const title = getByText('Settings');
    expect(flat(title).fontSize).toBe(34);
    expect(flat(title).textTransform).toBe('uppercase');
    expect(flat(title).color).toBe(useThemeStore.getState().tokens.text);
    const label = getByText('Store & wallet');
    expect(flat(label).fontSize).toBe(11);
    expect(flat(label).color).toBe(useThemeStore.getState().tokens.muted);
  });

  test('store, wallet and tutorial rows keep their targets', async () => {
    const { getByText, queryByText } = await renderSettings();
    fireEvent.press(getByText('Store'));
    expect(mockPush).toHaveBeenCalledWith('/apps/store');
    fireEvent.press(getByText('Wallet'));
    expect(mockPush).toHaveBeenCalledWith('/apps/wallet');
    expect(queryByText('tutorial-open')).toBeNull();
    fireEvent.press(getByText('Open tutorial'));
    expect(getByText('tutorial-open')).toBeTruthy();
  });

  describe('biometric', () => {
    test('available: a switch row that persists the choice', async () => {
      const { getByLabelText } = await renderSettings();
      const sw = getByLabelText('Face ID login');
      expect(sw.props.accessibilityRole).toBe('switch');
      expect(sw.props.accessibilityState.checked).toBe(false);
      await act(async () => { fireEvent.press(sw); });
      expect(mockSetBiometricEnabled).toHaveBeenCalledWith(true);
      expect(getByLabelText('Face ID login').props.accessibilityState.checked).toBe(true);
    });

    test('unavailable: no biometric row', async () => {
      mockBioState.available = false;
      const { queryByLabelText } = await renderSettings();
      expect(queryByLabelText('Face ID login')).toBeNull();
    });
  });

  describe('role upgrade', () => {
    test('player without a club can open the club dialog and close it', async () => {
      mockResolve.mockResolvedValue({ user: { id: 'u1' }, player: PLAYER, presidentClub: null });
      writeAccountIntent('player', 'u1');
      const { findByLabelText, getByLabelText, getByText, queryByText } = await renderSettings();
      fireEvent.press(await findByLabelText('Add president role'));
      expect(getByText('club-setup')).toBeTruthy();
      expect(getByText('Create your president club')).toBeTruthy();
      fireEvent.press(getByLabelText('Close'));
      await waitFor(() => expect(queryByText('club-setup')).toBeNull());
    });

    test('president without a player can open the player dialog', async () => {
      mockResolve.mockResolvedValue({ user: { id: 'u1' }, player: null, presidentClub: { id: 'c1' } });
      writeAccountIntent('president', 'u1');
      const { findByLabelText, getByText } = await renderSettings();
      fireEvent.press(await findByLabelText('Add player role'));
      expect(getByText('player-setup')).toBeTruthy();
    });

    test('player and president (or neither) see no upgrade card', async () => {
      mockResolve.mockResolvedValue({ user: { id: 'u1' }, player: PLAYER, presidentClub: { id: 'c1' } });
      writeAccountIntent('both', 'u1');
      const { queryByLabelText, queryByText } = await renderSettings();
      // the card shows its own "checking roles" state until the account resolves
      await waitFor(() => expect(queryByText('Checking your account roles...')).toBeNull());
      expect(queryByLabelText('Add president role')).toBeNull();
      expect(queryByLabelText('Add player role')).toBeNull();
      expect(queryByText('Account roles')).toBeNull();
    });
  });

  describe('theme switch', () => {
    test('Dark / Live Dark segmented control drives the theme store and the Live Dark controls', async () => {
      const { getByLabelText, queryByLabelText, getByText } = await renderSettings();
      expect(useThemeStore.getState().stageId).toBe('theme-dark');
      expect(queryByLabelText('Increase blur')).toBeNull();
      expect(getByLabelText('Dark').props.accessibilityState.selected).toBe(true);
      expect(getByLabelText('LIVE DARK').props.accessibilityState.selected).toBe(false);

      fireEvent.press(getByLabelText('LIVE DARK'));
      await waitFor(() => expect(useThemeStore.getState().stageId).toBe('theme-video'));
      expect(useThemeStore.getState().tokens.live).toBe(true);
      expect(getByLabelText('LIVE DARK').props.accessibilityState.selected).toBe(true);
      expect(getByText(/Background blur: \d+px/)).toBeTruthy();

      fireEvent.press(getByLabelText('Increase blur'));
      expect(getByText(/Background blur: 2px/)).toBeTruthy();
      fireEvent.press(getByLabelText('Decrease overlay'));
      expect(getByText(/Dark blue overlay: 13%/)).toBeTruthy();

      fireEvent.press(getByLabelText('Dark'));
      await waitFor(() => expect(useThemeStore.getState().stageId).toBe('theme-dark'));
      expect(queryByLabelText('Increase blur')).toBeNull();
    });

    test('Live Dark upload slots: filled picks it, empty opens the picker, long press clears', async () => {
      const ImagePicker = require('expo-image-picker');
      ImagePicker.launchImageLibraryAsync.mockResolvedValue({ canceled: false, assets: [{ uri: 'file:///new.jpg' }] });
      useTheme('theme-video');
      polyfillStorage.setItem('stage-theme', 'theme-video');
      polyfillStorage.setItem('stage-live-dark-uploads', JSON.stringify(['file:///a.jpg', '', '']));
      const { getByLabelText } = await renderSettings();

      fireEvent.press(getByLabelText('Use upload 1 as background'));
      expect(polyfillStorage.getItem('stage-live-dark-bg')).toBe('custom-0');

      await act(async () => { fireEvent.press(getByLabelText('Upload background 2')); });
      expect(ImagePicker.launchImageLibraryAsync).toHaveBeenCalled();
      expect(JSON.parse(polyfillStorage.getItem('stage-live-dark-uploads'))[1]).toBe('file:///new.jpg');

      fireEvent(getByLabelText('Use upload 1 as background'), 'longPress');
      expect(JSON.parse(polyfillStorage.getItem('stage-live-dark-uploads'))[0]).toBe('');
      polyfillStorage.setItem('stage-live-dark-uploads', '[]');
    });

    test('Live Dark renders without stray hex or undefined style keys', async () => {
      useTheme('theme-video');
      polyfillStorage.setItem('stage-theme', 'theme-video');
      const { toJSON, getByLabelText } = await renderSettings();
      expect(getByLabelText('LIVE DARK').props.accessibilityState.selected).toBe(true);
      expect(strayHex(toJSON)).toEqual([]);
      expect(undefinedStyleKeys(toJSON)).toEqual([]);
    });
  });

  describe('language and timezone', () => {
    test('language select is a 50 high field; the sheet changes the language', async () => {
      const { getByLabelText, getByText } = await renderSettings();
      const field = getByLabelText(/^Language, /);
      expect(flat(field).height).toBe(50);
      expect(flat(field).borderRadius).toBe(12);
      fireEvent.press(field);
      fireEvent.press(getByLabelText(/Français/));
      // the screen re-renders in the chosen language
      expect(getByLabelText(/^Langue, .*Français/)).toBeTruthy();
      expect(getByText('Match times use this timezone. Brussels automatically switches between CET and CEST.')).toBeTruthy();
    });

    test('an unlisted timezone is still offered, and a long one truncates', async () => {
      const long = `Region/${'Long_City_'.repeat(8)}`;
      mockMe.mockResolvedValue({ language: 'en', timezone: long });
      const { getByLabelText, getAllByText } = await renderSettings();
      const field = getByLabelText(`Timezone, ${long}`);
      expect(field).toBeTruthy();
      const valueText = getAllByText(long)[0];
      expect(valueText.props.numberOfLines).toBe(1);
      fireEvent.press(field);
      // 11 options (10 listed + this one) so the sheet shows its search field
      fireEvent.changeText(getByLabelText('Search…'), 'Long_City');
      expect(getAllByText(long).length).toBeGreaterThan(1);
      expect(getAllByText(long).every((n) => n.props.numberOfLines === 1)).toBe(true);
    });

    test('save sends the language, theme fields and timezone', async () => {
      const { getByLabelText } = await renderSettings();
      await act(async () => { fireEvent.press(getByLabelText('Save changes')); });
      expect(mockUpdateMe).toHaveBeenCalledWith(expect.objectContaining({
        language: 'en',
        customPrimaryColor: '#00d4ff',
        customSecondaryTextColor: '#e0e0e0',
        customBackgroundOpacity: 0.95,
      }));
      expect(mockUpdateTimezone).toHaveBeenCalledWith('Europe/Brussels');
      expect(getByLabelText('Settings saved')).toBeTruthy();
    });

    test('a failed save keeps the screen usable', async () => {
      mockUpdateMe.mockRejectedValueOnce(new Error('nope'));
      const alertSpy = jest.spyOn(require('react-native').Alert, 'alert').mockImplementation(() => {});
      const { getByLabelText } = await renderSettings();
      await act(async () => { fireEvent.press(getByLabelText('Save changes')); });
      expect(alertSpy).toHaveBeenCalledWith('Save failed', 'nope');
      expect(getByLabelText('Save changes')).toBeTruthy();
      alertSpy.mockRestore();
    });
  });

  describe('notifications', () => {
    test('toggling a category updates the player and flips the switch', async () => {
      const { getAllByLabelText } = await renderSettings();
      const sw = getAllByLabelText('Match reminders, email')[0];
      expect(sw.props.accessibilityState.checked).toBe(true);
      await act(async () => { fireEvent.press(sw); });
      expect(mockPlayerUpdate).toHaveBeenCalledWith('p1', expect.objectContaining({ notification_settings: expect.any(Object) }));
      expect(getAllByLabelText('Match reminders, email')[0].props.accessibilityState.checked).toBe(false);
    });

    test('without a player nothing is saved remotely but the toggle still flips', async () => {
      mockResolve.mockResolvedValue({ user: { id: 'u1' }, player: null, presidentClub: { id: 'c1' } });
      const { getAllByLabelText } = await renderSettings();
      await act(async () => { fireEvent.press(getAllByLabelText('Messages, mobile')[0]); });
      expect(mockPlayerUpdate).not.toHaveBeenCalled();
      expect(getAllByLabelText('Messages, mobile')[0].props.accessibilityState.checked).toBe(false);
    });

    test('push on: toggling asks the native layer to opt out', async () => {
      const { getByLabelText } = await renderSettings();
      const sw = getByLabelText('Lock screen & banners');
      expect(sw.props.accessibilityState.checked).toBe(true);
      await act(async () => { fireEvent.press(sw); });
      expect(mockSetPush).toHaveBeenCalledWith(false);
    });

    test('push toggle is disabled (not just dimmed) while the native call is busy', async () => {
      let release;
      mockSetPush.mockReturnValueOnce(new Promise((r) => { release = r; }));
      const { getByLabelText } = await renderSettings();
      fireEvent.press(getByLabelText('Lock screen & banners'));
      await waitFor(() => expect(getByLabelText('Lock screen & banners').props.accessibilityState.disabled).toBe(true));
      expect(flat(getByLabelText('Lock screen & banners')).opacity).toBe(0.5);
      fireEvent.press(getByLabelText('Lock screen & banners'));
      expect(mockSetPush).toHaveBeenCalledTimes(1);
      await act(async () => { release(); });
      await waitFor(() => expect(getByLabelText('Lock screen & banners').props.accessibilityState.disabled).toBe(false));
      expect(flat(getByLabelText('Lock screen & banners')).opacity).toBe(1);
    });

    test('push permission denied: explains and offers the phone settings', async () => {
      mockPush2 = { configured: true, permission: false, optedIn: false };
      const openSettings = jest.spyOn(Linking, 'openSettings').mockImplementation(() => Promise.resolve());
      const { getByText, getByLabelText } = await renderSettings();
      expect(getByText('STAGE does not have notification permission on this phone.')).toBeTruthy();
      fireEvent.press(getByLabelText('Open phone notification settings'));
      expect(openSettings).toHaveBeenCalled();
      openSettings.mockRestore();
    });

    test('push not configured: only the explanation', async () => {
      mockPush2 = { configured: false, permission: false, optedIn: false };
      const { getByText, queryByLabelText } = await renderSettings();
      expect(getByText(/Push is not configured on this build/)).toBeTruthy();
      expect(queryByLabelText('Lock screen & banners')).toBeNull();
    });

    test('test toasts: the all button and each sample chip', async () => {
      const { getByLabelText, getAllByText } = await renderSettings();
      fireEvent.press(getByLabelText('Send all test toasts'));
      expect(mockToast).toHaveBeenCalledTimes(8);
      mockToast.mockClear();
      // only the chip is pressable; the 'Messages' row labels in the switches are not
      getAllByText('Messages').forEach((node) => fireEvent.press(node));
      expect(mockToast).toHaveBeenCalledTimes(1);
      expect(mockToast).toHaveBeenCalledWith('Messages · New chat from Neo');
    });
  });

  describe('password', () => {
    test('opens the form, validates, and calls changePassword', async () => {
      const { getByLabelText, getByText, queryByLabelText } = await renderSettings();
      fireEvent.press(getByLabelText('Change Password'));
      const update = getByLabelText('Update Password');
      expect(update.props.accessibilityState.disabled).toBe(true);

      fireEvent.changeText(getByLabelText(/^Current password$/i), 'oldpass1');
      fireEvent.changeText(getByLabelText(/^New password$/i), 'newpass12');
      fireEvent.changeText(getByLabelText(/^Confirm.*password$/i), 'different1');
      fireEvent.press(getByLabelText('Update Password'));
      expect(getByText('Passwords do not match')).toBeTruthy();

      fireEvent.changeText(getByLabelText(/^Confirm.*password$/i), 'newpass12');
      await act(async () => { fireEvent.press(getByLabelText('Update Password')); });
      expect(mockInvoke).toHaveBeenCalledWith('changePassword', { current_password: 'oldpass1', new_password: 'newpass12' });
      expect(getByText('Password changed successfully')).toBeTruthy();
      fireEvent.press(getByLabelText('Cancel'));
      expect(queryByLabelText('Cancel')).toBeNull();
    });

    test('the eye buttons are labelled and flip secureTextEntry', async () => {
      const { getByLabelText } = await renderSettings();
      fireEvent.press(getByLabelText('Change Password'));
      const input = getByLabelText(/^Current password$/i);
      expect(input.props.secureTextEntry).toBe(true);
      fireEvent.press(getByLabelText(/^Show current password$/i));
      expect(getByLabelText(/^Current password$/i).props.secureTextEntry).toBe(false);
      expect(getByLabelText(/^Hide current password$/i)).toBeTruthy();
    });
  });

  describe('community, sign out and delete', () => {
    test('Discord opens the invite link', async () => {
      const open = jest.spyOn(Linking, 'openURL').mockImplementation(() => Promise.resolve());
      const { getByLabelText } = await renderSettings();
      fireEvent.press(getByLabelText('Join Discord'));
      expect(open).toHaveBeenCalledWith('https://discord.example/invite');
      open.mockRestore();
    });

    test('sign out is a danger row that logs out and returns to login', async () => {
      const { getByText } = await renderSettings();
      const label = getByText('Sign Out');
      expect(flat(label).color).toBe(useThemeStore.getState().tokens.danger);
      await act(async () => { fireEvent.press(label); });
      expect(mockLogout).toHaveBeenCalled();
      expect(mockReplace).toHaveBeenCalledWith('/auth/loginscreen');
    });

    test('delete: the confirm button stays disabled until DELETE is typed', async () => {
      const { getByLabelText } = await renderSettings();
      fireEvent.press(getByLabelText('Delete Account'));
      const confirm = getByLabelText('Delete My Account');
      expect(confirm.props.accessibilityState.disabled).toBe(true);
      fireEvent.changeText(getByLabelText(/Type/i), 'nope');
      expect(getByLabelText('Delete My Account').props.accessibilityState.disabled).toBe(true);
      fireEvent.changeText(getByLabelText(/Type/i), 'DELETE');
      expect(getByLabelText('Delete My Account').props.accessibilityState.disabled).toBe(false);
      await act(async () => { fireEvent.press(getByLabelText('Delete My Account')); });
      expect(mockInvoke).toHaveBeenCalledWith('deleteAccount', {});
      expect(mockLogout).toHaveBeenCalled();
      expect(mockReplace).toHaveBeenCalledWith('/auth/loginscreen');
          });

    test('delete: the destructive confirm carries a trash icon', async () => {
      const { getByLabelText, UNSAFE_getAllByProps } = await renderSettings();
      fireEvent.press(getByLabelText('Delete Account'));
      const confirm = getByLabelText('Delete My Account');
      expect(confirm.findAll((n) => n.props?.name === 'trash-outline').length).toBeGreaterThan(0);
      // the Danger Zone button keeps its own trash icon too
      expect(UNSAFE_getAllByProps({ name: 'trash-outline' }).length).toBeGreaterThan(1);
    });

    test('delete dialog card paints an opaque surface in Live Dark and in Dark', async () => {
      const firstBackground = (text) => {
        let node = text.parent;
        while (node) {
          const bg = StyleSheet.flatten(node.props.style)?.backgroundColor;
          if (bg) return bg;
          node = node.parent;
        }
        return undefined;
      };
      useTheme('theme-video');
      polyfillStorage.setItem('stage-theme', 'theme-video');
      const live = await renderSettings();
      fireEvent.press(live.getByLabelText('Delete Account'));
      const liveTokens = useThemeStore.getState().tokens;
      expect(liveTokens.live).toBe(true);
      expect(firstBackground(live.getByText('Type DELETE to confirm:'))).toBe(liveTokens.bgDeep);
      live.unmount();

      useTheme('theme-dark');
      polyfillStorage.setItem('stage-theme', 'theme-dark');
      const dark = await renderSettings();
      fireEvent.press(dark.getByLabelText('Delete Account'));
      expect(firstBackground(dark.getByText('Type DELETE to confirm:'))).toBe(useThemeStore.getState().tokens.card);
    });

    test('delete: Cancel closes the dialog and clears the input', async () => {
      const { getByLabelText, queryByLabelText } = await renderSettings();
      fireEvent.press(getByLabelText('Delete Account'));
      fireEvent.changeText(getByLabelText(/Type/i), 'DELE');
      fireEvent.press(getByLabelText('Cancel'));
      await waitFor(() => expect(queryByLabelText('Delete My Account')).toBeNull());
    });
  });
});
