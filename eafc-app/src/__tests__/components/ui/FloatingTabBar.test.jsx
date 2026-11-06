import React from 'react';
import { StyleSheet, Keyboard } from 'react-native';
import { render, fireEvent, act } from '@testing-library/react-native';
import useThemeStore from '../../../store/themeStore';
import FloatingTabBar from '../../../components/ui/FloatingTabBar';

jest.mock('@expo/vector-icons/Ionicons', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return {
    __esModule: true,
    default: ({ name, color }) => React.createElement(Text, { testID: `icon-${name}`, style: { color } }, name),
  };
});

jest.mock('expo-blur', () => {
  const React = require('react');
  const { View } = require('react-native');
  return { BlurView: (props) => React.createElement(View, { testID: 'blur', ...props }) };
});

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: jest.fn(() => ({ top: 0, bottom: 0, left: 0, right: 0 })),
}));

const { useSafeAreaInsets } = require('react-native-safe-area-context');

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

const TABS = [
  { name: 'dashboard', title: 'Home', idle: 'home-outline', active: 'home' },
  { name: 'matches', title: 'Game Day', idle: 'football-outline', active: 'football' },
  { name: 'tournaments', title: 'Tournaments', idle: 'trophy-outline', active: 'trophy' },
  { name: 'profile', title: 'Profile', idle: 'person-outline', active: 'person' },
  { name: 'search', title: 'Search', idle: 'search-outline', active: 'search' },
];

function buildProps(index = 0, optionOverrides = {}) {
  const routes = TABS.map((t) => ({ key: `${t.name}-key`, name: t.name }));
  const descriptors = {};
  TABS.forEach((t) => {
    descriptors[`${t.name}-key`] = {
      options: { title: t.title, tabBarHideOnKeyboard: true, ...optionOverrides },
    };
  });
  const navigation = {
    navigate: jest.fn(),
    emit: jest.fn(() => ({ defaultPrevented: false })),
  };
  return { state: { index, routes, key: 'tab' }, descriptors, navigation, insets: {} };
}

describe('FloatingTabBar', () => {
  beforeEach(() => {
    useTheme('theme-dark');
    useSafeAreaInsets.mockReturnValue({ top: 0, bottom: 0, left: 0, right: 0 });
  });

  it('hides tabs marked display none through tabBarItemStyle (and legacy href null)', () => {
    const props = buildProps();
    props.descriptors['matches-key'].options.tabBarItemStyle = [{ display: 'none' }];
    props.descriptors['profile-key'].options.tabBarItemStyle = { display: 'none' };
    props.descriptors['search-key'].options.href = null;
    const { getAllByRole, queryByLabelText, getByLabelText } = render(<FloatingTabBar {...props} />);
    expect(getAllByRole('tab')).toHaveLength(2);
    expect(queryByLabelText('Game Day')).toBeNull();
    expect(queryByLabelText('Profile')).toBeNull();
    expect(queryByLabelText('Search')).toBeNull();
    expect(getByLabelText('Home')).toBeTruthy();
    expect(getByLabelText('Tournaments')).toBeTruthy();
  });

  it('keeps tabs whose item style does not hide them', () => {
    const props = buildProps(0, { tabBarItemStyle: { display: 'flex' } });
    expect(render(<FloatingTabBar {...props} />).getAllByRole('tab')).toHaveLength(5);
  });

  it('renders five tabs in order with accessibility labels and roles', () => {
    const { getAllByRole } = render(<FloatingTabBar {...buildProps()} />);
    const tabs = getAllByRole('tab');
    expect(tabs).toHaveLength(5);
    expect(tabs.map((t) => t.props.accessibilityLabel)).toEqual([
      'Home',
      'Game Day',
      'Tournaments',
      'Profile',
      'Search',
    ]);
  });

  it('marks only the focused tab as selected', () => {
    const { getAllByRole } = render(<FloatingTabBar {...buildProps(2)} />);
    const selected = getAllByRole('tab').map((t) => t.props.accessibilityState?.selected === true);
    expect(selected).toEqual([false, false, true, false, false]);
  });

  it('draws the focused tab as a cyan filled icon on a card pill and idle tabs muted outline', () => {
    const { getByTestId, getByLabelText } = render(<FloatingTabBar {...buildProps(1)} />);
    const icon = getByTestId('icon-football');
    expect(flat(icon).color).toBe('#5FE3E8');
    const pill = getByTestId('tab-pill-matches');
    expect(flat(pill)).toMatchObject({ backgroundColor: '#132B5C', borderRadius: 14, width: 48, height: 48 });
    expect(flat(getByTestId('icon-home-outline')).color).toBe('#9FB3D1');
    expect(getByTestId('tab-pill-dashboard')).toBeTruthy();
    expect(flat(getByTestId('tab-pill-dashboard')).backgroundColor).toBeUndefined();
    expect(getByLabelText('Game Day')).toBeTruthy();
  });

  it('navigates when an idle tab is pressed and emits tabPress', () => {
    const props = buildProps(0);
    const { getByLabelText } = render(<FloatingTabBar {...props} />);
    fireEvent.press(getByLabelText('Tournaments'));
    expect(props.navigation.emit).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'tabPress', target: 'tournaments-key', canPreventDefault: true }),
    );
    expect(props.navigation.navigate).toHaveBeenCalledWith('tournaments', undefined);
  });

  it('does not navigate when the focused tab is pressed or the press is prevented', () => {
    const props = buildProps(0);
    const { getByLabelText } = render(<FloatingTabBar {...props} />);
    fireEvent.press(getByLabelText('Home'));
    expect(props.navigation.navigate).not.toHaveBeenCalled();

    props.navigation.emit.mockReturnValue({ defaultPrevented: true });
    fireEvent.press(getByLabelText('Profile'));
    expect(props.navigation.navigate).not.toHaveBeenCalled();
  });

  it('floats 16px from the sides, tabBottom from the bottom, 64 high with radius 22', () => {
    const { getByTestId } = render(<FloatingTabBar {...buildProps()} />);
    expect(flat(getByTestId('floating-tab-bar'))).toMatchObject({
      position: 'absolute',
      left: 16,
      right: 16,
      bottom: 24,
      height: 64,
      borderRadius: 22,
      backgroundColor: '#07163A',
      borderColor: '#234480',
    });
  });

  it('keeps the bar above a larger bottom inset', () => {
    useSafeAreaInsets.mockReturnValue({ top: 0, bottom: 34, left: 0, right: 0 });
    const { getByTestId } = render(<FloatingTabBar {...buildProps()} />);
    expect(flat(getByTestId('floating-tab-bar')).bottom).toBe(34);
  });

  it('uses a solid bar without blur in dark', () => {
    const { queryByTestId } = render(<FloatingTabBar {...buildProps()} />);
    expect(queryByTestId('blur')).toBeNull();
  });

  it('blurs the wallpaper behind the bar in Live Dark', () => {
    useTheme('theme-video');
    const { getByTestId } = render(<FloatingTabBar {...buildProps()} />);
    expect(getByTestId('blur')).toBeTruthy();
    expect(flat(getByTestId('floating-tab-bar')).backgroundColor).not.toBe('#07163A');
  });

  describe('keyboard', () => {
    let handlers;
    let addSpy;
    beforeEach(() => {
      handlers = {};
      addSpy = jest.spyOn(Keyboard, 'addListener').mockImplementation((evt, cb) => {
        handlers[evt] = cb;
        return { remove: jest.fn() };
      });
    });
    afterEach(() => addSpy.mockRestore());

    const show = () => (handlers.keyboardWillShow || handlers.keyboardDidShow)();
    const hide = () => (handlers.keyboardWillHide || handlers.keyboardDidHide)();

    it('hides while the keyboard is open when tabBarHideOnKeyboard is set', () => {
      const { queryByTestId } = render(<FloatingTabBar {...buildProps()} />);
      expect(queryByTestId('floating-tab-bar')).toBeTruthy();
      act(() => show());
      expect(queryByTestId('floating-tab-bar')).toBeNull();
      act(() => hide());
      expect(queryByTestId('floating-tab-bar')).toBeTruthy();
    });

    it('stays visible with the keyboard open when tabBarHideOnKeyboard is off', () => {
      const { queryByTestId } = render(
        <FloatingTabBar {...buildProps(0, { tabBarHideOnKeyboard: false })} />,
      );
      act(() => show());
      expect(queryByTestId('floating-tab-bar')).toBeTruthy();
    });
  });
});
