import React from 'react';
import { Text } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import { pageBottomPad } from '../../../lib/pageInsets';
import { guideFabClearance, guideFabBottom, guideFabClearanceStack } from '../../../components/ui/metrics';
import useThemeStore from '../../../store/themeStore';
import {
  Screen,
  Card,
  Button,
  IconButton,
  Chip,
  SectionLabel,
  Avatar,
  ListRow,
} from '../../../components/ui';

jest.mock('expo-linear-gradient', () => {
  const React = require('react');
  const { View } = require('react-native');
  return { LinearGradient: ({ children, style }) => React.createElement(View, { style }, children) };
});

jest.mock('@expo/vector-icons/Ionicons', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return { __esModule: true, default: ({ name }) => React.createElement(Text, null, name) };
});

jest.mock('expo-blur', () => {
  const React = require('react');
  const { View } = require('react-native');
  return { BlurView: ({ children, style }) => React.createElement(View, { style }, children) };
});

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

describe('ui primitives A', () => {
  beforeEach(() => useTheme('theme-dark'));

  describe('Button', () => {
    test('primary is cyan, 52 high, radius 14', () => {
      const { getByTestId } = render(<Button testID="btn" title="Go" onPress={() => {}} />);
      const style = flat(getByTestId('btn'));
      expect(style.backgroundColor).toBe('#4A6AA5');
      expect(style.height).toBe(52);
      expect(style.borderRadius).toBe(14);
    });

    test('secondary is outlined cyan, danger is outlined danger', () => {
      const { getByTestId, rerender } = render(<Button testID="btn" variant="secondary" title="Go" onPress={() => {}} />);
      expect(flat(getByTestId('btn')).borderColor).toBe('#4A6AA5');
      expect(flat(getByTestId('btn')).backgroundColor).toBe('transparent');
      rerender(<Button testID="btn" variant="danger" title="Go" onPress={() => {}} />);
      expect(flat(getByTestId('btn')).borderColor).toBe('#F87171');
    });

    test('loading hides the title and ignores presses', () => {
      const onPress = jest.fn();
      const { queryByText, getByTestId } = render(<Button testID="btn" title="Save" loading onPress={onPress} />);
      expect(queryByText('Save')).toBeNull();
      fireEvent.press(getByTestId('btn'));
      expect(onPress).not.toHaveBeenCalled();
    });

    test('calls onPress, and not when disabled', () => {
      const onPress = jest.fn();
      const { getByTestId, rerender } = render(<Button testID="btn" title="Save" onPress={onPress} />);
      fireEvent.press(getByTestId('btn'));
      expect(onPress).toHaveBeenCalledTimes(1);
      rerender(<Button testID="btn" title="Save" disabled onPress={onPress} />);
      fireEvent.press(getByTestId('btn'));
      expect(onPress).toHaveBeenCalledTimes(1);
    });

    test('truncates a long title on one line', () => {
      const long = 'A'.repeat(60);
      const { getByText } = render(<Button title={long} onPress={() => {}} />);
      expect(getByText(long).props.numberOfLines).toBe(1);
    });
  });

  describe('Chip', () => {
    test('active is cyan, inactive is card, 34 high, pill', () => {
      const { getByTestId, rerender } = render(<Chip testID="chip" label="All" active />);
      expect(flat(getByTestId('chip')).backgroundColor).toBe('#4A6AA5');
      expect(flat(getByTestId('chip')).height).toBe(34);
      expect(flat(getByTestId('chip')).borderRadius).toBe(999);
      rerender(<Chip testID="chip" label="All" />);
      expect(flat(getByTestId('chip')).backgroundColor).toBe('#132B5C');
    });

    test('truncates a 60 character label on one line', () => {
      const long = 'B'.repeat(60);
      const { getByText } = render(<Chip label={long} />);
      expect(getByText(long).props.numberOfLines).toBe(1);
    });

    test('fires onPress', () => {
      const onPress = jest.fn();
      const { getByText } = render(<Chip label="All" onPress={onPress} />);
      fireEvent.press(getByText('All'));
      expect(onPress).toHaveBeenCalledTimes(1);
    });

    test('without onPress it is a plain View and is not reported as disabled', () => {
      const { getByTestId } = render(<Chip testID="chip" label="All" />);
      const node = getByTestId('chip');
      expect(node.props.accessible).not.toBe(true);
      expect(node.props.accessibilityState && node.props.accessibilityState.disabled).not.toBe(true);
      expect(node.props.accessibilityRole).toBeUndefined();
      expect(node.props.onClick).toBeUndefined();
      expect(node.props.onResponderRelease).toBeUndefined();
    });

    test('a static active chip keeps accessibilityState.selected', () => {
      const { getByTestId, rerender } = render(<Chip testID="chip" label="All" active />);
      expect(getByTestId('chip').props.accessibilityState.selected).toBe(true);
      expect(getByTestId('chip').props.accessibilityState.disabled).not.toBe(true);
      rerender(<Chip testID="chip" label="All" />);
      expect(getByTestId('chip').props.accessibilityState && getByTestId('chip').props.accessibilityState.selected).not.toBe(true);
    });

    test('with onPress it is an accessible button that is not disabled', () => {
      const { getByTestId } = render(<Chip testID="chip" label="All" onPress={() => {}} />);
      const node = getByTestId('chip');
      expect(node.props.accessibilityRole).toBe('button');
      expect(node.props.accessibilityState.disabled).not.toBe(true);
    });
  });

  describe('Card', () => {
    test('default uses card fill and border, radius 16, padding 16', () => {
      const { getByTestId } = render(<Card testID="card"><Text>x</Text></Card>);
      const style = flat(getByTestId('card'));
      expect(style.backgroundColor).toBe('#132B5C');
      expect(style.borderColor).toBe('#234480');
      expect(style.borderRadius).toBe(16);
      expect(style.padding).toBe(16);
    });

    test('highlight uses cardHi and aqua border', () => {
      const { getByTestId } = render(<Card testID="card" highlight><Text>x</Text></Card>);
      const style = flat(getByTestId('card'));
      expect(style.backgroundColor).toBe('#16346B');
      expect(style.borderColor).toBe('#3C5E99');
    });

    test('live renders through LiveGlass with no opaque card background', () => {
      useTheme('theme-video');
      const { getByTestId, UNSAFE_queryAllByProps } = render(<Card><Text>x</Text></Card>);
      expect(getByTestId('live-glass-clip')).toBeTruthy();
      const opaque = UNSAFE_queryAllByProps({}).filter((n) => {
        const s = n.props && n.props.style ? StyleSheet.flatten(n.props.style) : null;
        return s && s.backgroundColor === '#132B5C';
      });
      expect(opaque).toHaveLength(0);
    });

    test('onPress makes the card pressable', () => {
      const onPress = jest.fn();
      const { getByText } = render(<Card onPress={onPress}><Text>tap</Text></Card>);
      fireEvent.press(getByText('tap'));
      expect(onPress).toHaveBeenCalledTimes(1);
    });

    test('onPress passes accessibility props and testID to the Pressable', () => {
      const { getByTestId } = render(
        <Card testID="card" onPress={() => {}} accessibilityLabel="Open match" accessibilityHint="Opens the match">
          <Text>tap</Text>
        </Card>,
      );
      const node = getByTestId('card');
      expect(node.props.accessibilityRole).toBe('button');
      expect(node.props.accessibilityLabel).toBe('Open match');
      expect(node.props.accessibilityHint).toBe('Opens the match');
    });

    test('onPress puts caller layout (margin, flex, alignSelf, width) on the outer Pressable', () => {
      const { getByTestId } = render(
        <Card testID="card" onPress={() => {}} style={{ margin: 8, flex: 1, alignSelf: 'flex-start', width: 200 }}>
          <Text>tap</Text>
        </Card>,
      );
      const outer = flat(getByTestId('card'));
      expect(outer.margin).toBe(8);
      expect(outer.flex).toBe(1);
      expect(outer.alignSelf).toBe('flex-start');
      expect(outer.width).toBe(200);
      // the visual surface is the child: it must not repeat the margin
      const inner = getByTestId('card').children[0];
      expect(flat(inner).margin).toBeUndefined();
      expect(flat(inner).backgroundColor).toBe('#132B5C');
    });

    test('onPress shows pressed feedback (opacity 0.85)', () => {
      const { getByTestId } = render(<Card testID="card" onPress={() => {}}><Text>tap</Text></Card>);
      expect(flat(getByTestId('card')).opacity).toBe(1);
      const touch = { persist() {}, nativeEvent: { touches: [], changedTouches: [], timestamp: 0 } };
      fireEvent(getByTestId('card'), 'responderGrant', touch);
      expect(flat(getByTestId('card')).opacity).toBe(0.85);
    });

    test('live keeps testID on a plain card and on a pressable card', () => {
      useTheme('theme-video');
      const { getByTestId, rerender } = render(<Card testID="card"><Text>x</Text></Card>);
      expect(getByTestId('card')).toBeTruthy();
      rerender(<Card testID="card" onPress={() => {}} accessibilityLabel="Open"><Text>x</Text></Card>);
      expect(getByTestId('card').props.accessibilityLabel).toBe('Open');
    });

    test('live testID wrapper keeps layout on the wrapper and visuals on the glass (shared glass renderer)', () => {
      useTheme('theme-video');
      const { getByTestId } = render(
        <Card testID="card" highlight style={{ margin: 8, flex: 1, gap: 4 }}><Text>x</Text></Card>,
      );
      const outer = flat(getByTestId('card'));
      expect(outer.margin).toBe(8);
      expect(outer.flex).toBe(1);
      expect(outer.gap).toBeUndefined();
      const clip = getByTestId('live-glass-clip');
      expect(flat(clip).gap).toBe(4);
      expect(flat(clip).margin).toBeUndefined();
      expect(getByTestId('card-highlight')).toBeTruthy();
    });

    test('solid: opaque bgDeep in Live Dark (no glass), plain card colour in Dark', () => {
      useTheme('theme-video');
      const live = useThemeStore.getState().tokens;
      const { getByTestId, queryByTestId, rerender } = render(
        <Card testID="card" solid><Text>x</Text></Card>,
      );
      expect(queryByTestId('live-glass-clip')).toBeNull();
      expect(flat(getByTestId('card')).backgroundColor).toBe(live.bgDeep);
      expect(flat(getByTestId('card')).backgroundColor).not.toMatch(/^rgba/);
      expect(flat(getByTestId('card')).borderRadius).toBe(live.cardRadius);
      rerender(<Card testID="card"><Text>x</Text></Card>);
      expect(getByTestId('live-glass-clip')).toBeTruthy();

      useTheme('theme-dark');
      const dark = useThemeStore.getState().tokens;
      rerender(<Card testID="card" solid><Text>x</Text></Card>);
      expect(flat(getByTestId('card')).backgroundColor).toBe(dark.card);
    });

    test('live highlight shows a translucent cardHi tinted fill', () => {
      useTheme('theme-video');
      const cardHi = useThemeStore.getState().tokens.cardHi;
      expect(cardHi).toMatch(/^rgba\(/);
      const { UNSAFE_queryAllByProps, rerender } = render(<Card highlight><Text>x</Text></Card>);
      const tinted = () =>
        UNSAFE_queryAllByProps({}).filter((n) => {
          const s = n.props && n.props.style ? StyleSheet.flatten(n.props.style) : null;
          return s && s.backgroundColor === cardHi && n.props.testID === 'card-highlight';
        });
      expect(tinted().length).toBeGreaterThan(0);
      rerender(<Card><Text>x</Text></Card>);
      expect(tinted()).toHaveLength(0);
    });
  });

  describe('IconButton', () => {
    test('is 44x44 with radius 12', () => {
      const { getByTestId } = render(
        <IconButton testID="ib" icon="chevron-back" accessibilityLabel="Back" onPress={() => {}} />,
      );
      const style = flat(getByTestId('ib'));
      expect(style.width).toBe(44);
      expect(style.height).toBe(44);
      expect(style.borderRadius).toBe(12);
      expect(getByTestId('ib').props.accessibilityLabel).toBe('Back');
    });

    test('logs an error in dev when accessibilityLabel is missing', () => {
      const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
      render(<IconButton icon="chevron-back" onPress={() => {}} />);
      expect(spy.mock.calls.some((c) => /accessibilityLabel/.test(String(c[0])))).toBe(true);
      spy.mockRestore();
    });

    test('does not log when the label is present', () => {
      const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
      render(<IconButton icon="chevron-back" accessibilityLabel="Back" onPress={() => {}} />);
      expect(spy.mock.calls.some((c) => /accessibilityLabel/.test(String(c[0])))).toBe(false);
      spy.mockRestore();
    });
  });

  describe('Avatar', () => {
    test('defaults to a 44 tile with radius 12; round is size/2', () => {
      const { getByTestId, rerender } = render(<Avatar testID="av" initials="AB" />);
      expect(flat(getByTestId('av')).width).toBe(44);
      expect(flat(getByTestId('av')).borderRadius).toBe(12);
      rerender(<Avatar testID="av" initials="AB" size={60} round />);
      expect(flat(getByTestId('av')).width).toBe(60);
      expect(flat(getByTestId('av')).borderRadius).toBe(30);
    });

    test('shows initials', () => {
      const { getByText } = render(<Avatar initials="AB" />);
      expect(getByText('AB')).toBeTruthy();
    });
  });

  describe('SectionLabel', () => {
    test('renders uppercase muted label and right slot', () => {
      const { getByText } = render(<SectionLabel right={<Text>See all</Text>}>Next match</SectionLabel>);
      const label = getByText('Next match');
      expect(flat(label).color).toBe('#9FB3D1');
      expect(flat(label).textTransform).toBe('uppercase');
      expect(flat(label).fontSize).toBe(11);
      expect(flat(label).fontWeight).toBe('600');
      expect(flat(label).letterSpacing).toBeCloseTo(11 * 0.12, 5);
      expect(getByText('See all')).toBeTruthy();
    });
  });

  describe('ListRow', () => {
    test('danger title uses the danger colour', () => {
      const { getByText } = render(<ListRow title="Delete" danger onPress={() => {}} />);
      expect(flat(getByText('Delete')).color).toBe('#F87171');
    });

    test('shows value and fires onPress; truncates long titles', () => {
      const onPress = jest.fn();
      const long = 'C'.repeat(60);
      const { getByText } = render(<ListRow icon="person-outline" title={long} value="EN" onPress={onPress} />);
      expect(getByText('EN')).toBeTruthy();
      expect(getByText(long).props.numberOfLines).toBe(1);
      fireEvent.press(getByText('EN'));
      expect(onPress).toHaveBeenCalledTimes(1);
    });
  });

  describe('Screen', () => {
    test('dark renders solid bg, 20px gutters and tab bar clearance', () => {
      const { getByTestId } = render(<Screen testID="screen"><Text>body</Text></Screen>);
      const root = flat(getByTestId('screen'));
      expect(root.backgroundColor).toBe('#03153F');
      const content = flat(getByTestId('screen-content'));
      expect(content.paddingHorizontal).toBe(20);
      // tab bar (24 + 64 + 16) plus the 44px Guide button and 16 breathing room that float above it
      expect(content.paddingBottom).toBe(24 + 64 + 16 + 44 + 16);
      expect(content.paddingBottom).toBe(guideFabClearance(0));
    });

    test.each([0, 34])('tab screens clear the global Guide button for a %ipx bottom inset', (inset) => {
      const safe = require('react-native-safe-area-context');
      const spy = jest.spyOn(safe, 'useSafeAreaInsets').mockReturnValue({ top: 0, bottom: inset, left: 0, right: 0 });
      try {
        const { getByTestId } = render(<Screen testID="screen"><Text>body</Text></Screen>);
        const pad = flat(getByTestId('screen-content')).paddingBottom;
        expect(pad).toBeGreaterThanOrEqual(guideFabClearance(inset));
        // the last content row ends above the button's top edge (bottom offset + 44 tall)
        expect(pad).toBeGreaterThanOrEqual(guideFabBottom(inset) + 44);
      } finally {
        spy.mockRestore();
      }
    });

    test('tabBar false with guideFab clears the Guide button but not the tab bar', () => {
      const { getByTestId } = render(<Screen testID="screen" tabBar={false} guideFab><Text>body</Text></Screen>);
      const pad = flat(getByTestId('screen-content')).paddingBottom;
      expect(pad).toBe(guideFabClearanceStack(0));
      expect(pad).toBe(24 + 44 + 16);
    });

    test('tabBar false uses the page bottom inset', () => {
      const { getByTestId } = render(<Screen testID="screen" tabBar={false}><Text>body</Text></Screen>);
      expect(flat(getByTestId('screen-content')).paddingBottom).toBe(pageBottomPad(0));
    });

    test('a large bottom inset wins over the tab bar offset (max(inset, 24))', () => {
      const safe = require('react-native-safe-area-context');
      const spy = jest.spyOn(safe, 'useSafeAreaInsets').mockReturnValue({ top: 0, bottom: 48, left: 0, right: 0 });
      const { getByTestId, rerender } = render(<Screen testID="screen"><Text>body</Text></Screen>);
      expect(flat(getByTestId('screen-content')).paddingBottom).toBe(48 + 64 + 16 + 44 + 16);
      rerender(<Screen testID="screen" tabBar={false}><Text>body</Text></Screen>);
      expect(flat(getByTestId('screen-content')).paddingBottom).toBe(pageBottomPad(48));
      spy.mockRestore();
    });

    test('scroll false renders no ScrollView', () => {
      const { queryByTestId } = render(<Screen scroll={false}><Text>body</Text></Screen>);
      expect(queryByTestId('screen-scroll')).toBeNull();
    });

    test('live renders the wallpaper and no solid bg', () => {
      useTheme('theme-video');
      const { getByTestId } = render(<Screen testID="screen"><Text>body</Text></Screen>);
      expect(getByTestId('live-dark-wallpaper')).toBeTruthy();
      expect(flat(getByTestId('screen')).backgroundColor).toBe('transparent');
    });

    test('dark has no wallpaper', () => {
      const { queryByTestId } = render(<Screen><Text>body</Text></Screen>);
      expect(queryByTestId('live-dark-wallpaper')).toBeNull();
    });
  });
});
