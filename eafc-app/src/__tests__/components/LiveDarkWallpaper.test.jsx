import React from 'react';
import { Text } from 'react-native';
import { render } from '@testing-library/react-native';
import useThemeStore from '../../store/themeStore';
import LiveDarkWallpaper from '../../components/theme/LiveDarkWallpaper';
import { GamerProfileShell } from '../../components/profile/gamer/GamerProfileUI';

jest.mock('expo-linear-gradient', () => {
  const React = require('react');
  const { View } = require('react-native');
  const LinearGradient = ({ children, style }) => React.createElement(View, { style }, children);
  return { LinearGradient };
});

describe('Live Dark wallpaper', () => {
  beforeEach(() => {
    const store = {};
    global.localStorage = {
      getItem: (key) => (Object.prototype.hasOwnProperty.call(store, key) ? store[key] : null),
      setItem: (key, value) => { store[String(key)] = String(value); },
      removeItem: (key) => { delete store[String(key)]; },
    };
    useThemeStore.getState().refresh();
  });

  test('plants the photo on the page shell in Live Dark', () => {
    useThemeStore.getState().setStageTheme('theme-video');
    expect(useThemeStore.getState().liveDarkSource).toBeTruthy();

    const { getByTestId, getByText } = render(
      <GamerProfileShell>
        <Text>Home</Text>
      </GamerProfileShell>,
    );

    expect(getByTestId('live-dark-wallpaper')).toBeTruthy();
    expect(getByText('Home')).toBeTruthy();
  });

  test('Live Dark page chrome stays translucent so the photo shows through', () => {
    const ui = require('fs').readFileSync(
      require('path').resolve(__dirname, '../../components/dashboard/CommandCenterUI.jsx'),
      'utf8',
    );
    expect(ui).toMatch(/TILE_FILL_LIVE = 'rgba\(0,0,0,0\.4\)'/);
    expect(ui).toMatch(/tokens\?\.live === true/);
  });

  test('does not plant the photo in Dark', () => {
    useThemeStore.getState().setStageTheme('theme-dark');
    const { queryByTestId } = render(<LiveDarkWallpaper />);
    expect(queryByTestId('live-dark-wallpaper')).toBeNull();
  });
});
