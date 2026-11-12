import React from 'react';
import { StyleSheet } from 'react-native';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import useThemeStore from '../../store/themeStore';

const mockBack = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ back: mockBack, push: jest.fn() }) }));
jest.mock('expo-linear-gradient', () => {
  const ReactModule = require('react');
  const { View } = require('react-native');
  return { LinearGradient: ({ children, style, colors }) => ReactModule.createElement(View, { style, colors }, children) };
});
jest.mock('expo-blur', () => {
  const ReactModule = require('react');
  const { View } = require('react-native');
  return { BlurView: ({ children, style }) => ReactModule.createElement(View, { style }, children) };
});
jest.mock('expo-image-picker', () => ({
  launchImageLibraryAsync: jest.fn(),
  MediaTypeOptions: { Images: 'Images' },
}));

const mockMe = jest.fn();
const mockUpdateMe = jest.fn(() => Promise.resolve({}));
jest.mock('../../api/stageClient', () => ({
  resolveMyPlayerAndClub: jest.fn(() => Promise.resolve({})),
  stageClient: { auth: { me: (...a) => mockMe(...a), updateMe: (...a) => mockUpdateMe(...a) } },
}));

const polyfillStorage = require('../../lib/polyfillStorage').localStorage;
import AppearanceScreen from '../../app/apps/appearance';
import Screen from '../../components/ui/Screen';
import { Text } from 'react-native';
import { CUSTOM_THEME_KEY, readCustomTheme } from '../../lib/customTheme';

function installStorage() {
  const store = {};
  global.localStorage = {
    getItem: (key) => (Object.prototype.hasOwnProperty.call(store, key) ? store[key] : null),
    setItem: (key, value) => { store[String(key)] = String(value); },
    removeItem: (key) => { delete store[String(key)]; },
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  installStorage();
  polyfillStorage.removeItem('stage-live-dark-bg');
  polyfillStorage.removeItem('stage-live-dark-uploads');
  polyfillStorage.removeItem('stage-live-dark-fx');
  act(() => { useThemeStore.getState().setStageTheme('theme-dark'); });
  mockMe.mockResolvedValue({ language: 'en' });
});

async function renderAppearance() {
  const utils = render(<AppearanceScreen />);
  await utils.findByText('Theme');
  return utils;
}

describe('Appearance screen', () => {
  test('lists only Dark, Live Dark and Custom (no Day, no Live White)', async () => {
    const { getByLabelText, queryByLabelText } = await renderAppearance();
    expect(getByLabelText('Dark').props.accessibilityState.selected).toBe(true);
    expect(getByLabelText('Live Dark').props.accessibilityState.selected).toBe(false);
    expect(getByLabelText('Custom').props.accessibilityState.selected).toBe(false);
    expect(queryByLabelText(/Day|Live White/i)).toBeNull();
  });

  test('picking a theme applies it at once', async () => {
    const { getByLabelText } = await renderAppearance();
    fireEvent.press(getByLabelText('Live Dark'));
    await waitFor(() => expect(useThemeStore.getState().stageId).toBe('theme-video'));
    fireEvent.press(getByLabelText('Custom'));
    await waitFor(() => expect(useThemeStore.getState().stageId).toBe('theme-custom'));
    expect(useThemeStore.getState().tokens.live).toBe(false);
    expect(getByLabelText('Custom').props.accessibilityState.selected).toBe(true);
  });

  describe('Live Dark', () => {
    test('the background, images and effects only show with Live Dark', async () => {
      const { getByLabelText, queryByText, getByText } = await renderAppearance();
      expect(queryByText('Live Dark background')).toBeNull();
      fireEvent.press(getByLabelText('Live Dark'));
      expect(getByText('Live Dark background')).toBeTruthy();
      expect(getByText('My images · 0 / 3')).toBeTruthy();
      expect(getByLabelText('Blur')).toBeTruthy();
      expect(getByLabelText('Blue overlay')).toBeTruthy();
    });

    test('choosing a background stores the preference', async () => {
      const { getByLabelText } = await renderAppearance();
      fireEvent.press(getByLabelText('Live Dark'));
      fireEvent.press(getByLabelText('Trophies'));
      expect(polyfillStorage.getItem('stage-live-dark-bg')).toBe('trophies');
      expect(getByLabelText('Trophies').props.accessibilityState.selected).toBe(true);
    });

    test('blur and overlay sliders drive the Live Dark effects', async () => {
      const { getByLabelText, getByText } = await renderAppearance();
      fireEvent.press(getByLabelText('Live Dark'));
      fireEvent(getByLabelText('Blur'), 'accessibilityAction', { nativeEvent: { actionName: 'increment' } });
      expect(useThemeStore.getState().liveDarkFx.blur).toBe(1);
      expect(getByText('1')).toBeTruthy();
      fireEvent(getByLabelText('Blue overlay'), 'accessibilityAction', { nativeEvent: { actionName: 'decrement' } });
      expect(useThemeStore.getState().liveDarkFx.overlay).toBeCloseTo(0.15, 2);
      expect(getByText('15%')).toBeTruthy();
    });

    test('images: an empty slot opens the picker, a filled one is used, and it can be removed', async () => {
      const ImagePicker = require('expo-image-picker');
      ImagePicker.launchImageLibraryAsync.mockResolvedValue({ canceled: false, assets: [{ uri: 'file:///a.jpg' }] });
      const { getByLabelText, getByText, queryByLabelText } = await renderAppearance();
      fireEvent.press(getByLabelText('Live Dark'));
      fireEvent.press(getByLabelText('Upload background 1'));
      await waitFor(() => expect(getByLabelText('Use upload 1 as background')).toBeTruthy());
      expect(polyfillStorage.getItem('stage-live-dark-bg')).toBe('custom-0');
      expect(getByText('My images · 1 / 3')).toBeTruthy();
      fireEvent(getByLabelText('Use upload 1 as background'), 'accessibilityAction', { nativeEvent: { actionName: 'remove' } });
      expect(queryByLabelText('Use upload 1 as background')).toBeNull();
      expect(getByText('My images · 0 / 3')).toBeTruthy();
    });

    test('Add image fills the first free slot, and refuses when all three are used', async () => {
      const ImagePicker = require('expo-image-picker');
      const { Alert } = require('react-native');
      const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
      ImagePicker.launchImageLibraryAsync.mockResolvedValue({ canceled: false, assets: [{ uri: 'file:///b.jpg' }] });
      const { getByText, getByLabelText } = await renderAppearance();
      fireEvent.press(getByLabelText('Live Dark'));
      for (let i = 0; i < 3; i += 1) {
        fireEvent.press(getByText('+ Add image'));
        // eslint-disable-next-line no-await-in-loop
        await waitFor(() => expect(getByText(`My images · ${i + 1} / 3`)).toBeTruthy());
      }
      fireEvent.press(getByText('+ Add image'));
      await waitFor(() => expect(alertSpy).toHaveBeenCalled());
      alertSpy.mockRestore();
    });
  });

  describe('Custom', () => {
    test('the colour fields are real: typing a valid hex changes the theme tokens', async () => {
      const { getByLabelText } = await renderAppearance();
      fireEvent.press(getByLabelText('Custom'));
      fireEvent.changeText(getByLabelText('Primary'), '#ff8800');
      await waitFor(() => expect(useThemeStore.getState().tokens.cyan).toBe('#ff8800'));
      fireEvent.changeText(getByLabelText('Background'), '#101820');
      await waitFor(() => expect(useThemeStore.getState().tokens.bg).toBe('#101820'));
      expect(JSON.parse(global.localStorage.getItem(CUSTOM_THEME_KEY)).primaryColor).toBe('#ff8800');
    });

    test('an invalid hex is flagged and not applied', async () => {
      const { getByLabelText, getAllByText } = await renderAppearance();
      fireEvent.press(getByLabelText('Custom'));
      const before = useThemeStore.getState().tokens.cyan;
      fireEvent.changeText(getByLabelText('Primary'), '#zzz');
      expect(getAllByText('Use a colour like #1A2B3C').length).toBeGreaterThan(0);
      expect(useThemeStore.getState().tokens.cyan).toBe(before);
    });

    test('background opacity slider updates the custom backdrop', async () => {
      const { getByLabelText } = await renderAppearance();
      fireEvent.press(getByLabelText('Custom'));
      fireEvent(getByLabelText('Background opacity'), 'accessibilityAction', { nativeEvent: { actionName: 'decrement' } });
      expect(readCustomTheme().backgroundOpacity).toBeCloseTo(0.9, 2);
      expect(useThemeStore.getState().tokens.customBackdrop.opacity).toBeCloseTo(0.9, 2);
    });

    test('the colour fields are dimmed until Custom is selected', async () => {
      const { getByLabelText, getByTestId } = await renderAppearance();
      expect(StyleSheet.flatten(getByTestId('custom-colours').props.style).opacity).toBeLessThan(1);
      fireEvent.press(getByLabelText('Custom'));
      expect(StyleSheet.flatten(getByTestId('custom-colours').props.style).opacity).toBe(1);
    });

    test('Screen paints the user backdrop in the Custom theme', async () => {
      const { getByLabelText, UNSAFE_getAllByType } = await renderAppearance();
      fireEvent.press(getByLabelText('Custom'));
      const view = render(<Screen><Text>x</Text></Screen>);
      const colors = view.getByTestId('stage-bg').children.map((c) => c.props.colors).filter(Boolean)[0];
      expect(colors[0]).toBe(readCustomTheme().backgroundColor);
    });
  });

  describe('loading and saving', () => {
    test('colours saved on the user are applied when the screen opens', async () => {
      mockMe.mockResolvedValue({ customPrimaryColor: '#123456', customBackgroundColor: '#0a0a0a' });
      render(<AppearanceScreen />);
      await waitFor(() => expect(readCustomTheme().primaryColor).toBe('#123456'));
      expect(readCustomTheme().backgroundColor).toBe('#0a0a0a');
    });

    test('a failing profile load does not block the screen', async () => {
      mockMe.mockRejectedValue(new Error('offline'));
      const { getByLabelText } = await renderAppearance();
      expect(getByLabelText('Dark')).toBeTruthy();
    });

    test('Save sends the custom theme on the user fields', async () => {
      const { getByLabelText, findByLabelText } = await renderAppearance();
      fireEvent.press(getByLabelText('Custom'));
      fireEvent.changeText(getByLabelText('Primary'), '#ff8800');
      fireEvent.press(getByLabelText('Save'));
      await waitFor(() => expect(mockUpdateMe).toHaveBeenCalledWith(expect.objectContaining({
        customPrimaryColor: '#ff8800',
        customGradientColor: expect.any(String),
        customBackgroundColor: expect.any(String),
        customBackgroundOpacity: expect.any(Number),
        customTextColor: expect.any(String),
      })));
      expect(await findByLabelText('Saved')).toBeTruthy();
    });

    test('a failed save is reported and the local theme stays', async () => {
      mockUpdateMe.mockRejectedValueOnce(new Error('Server says no'));
      const { getByLabelText, findByText } = await renderAppearance();
      fireEvent.press(getByLabelText('Custom'));
      fireEvent.changeText(getByLabelText('Primary'), '#ff8800');
      fireEvent.press(getByLabelText('Save'));
      expect(await findByText('Server says no')).toBeTruthy();
      expect(useThemeStore.getState().tokens.cyan).toBe('#ff8800');
    });

    test('Back leaves the screen', async () => {
      const { getByLabelText } = await renderAppearance();
      fireEvent.press(getByLabelText('Back'));
      expect(mockBack).toHaveBeenCalled();
    });
  });
});
