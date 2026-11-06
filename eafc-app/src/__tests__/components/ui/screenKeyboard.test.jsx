import React from 'react';
import { Text, Platform, KeyboardAvoidingView } from 'react-native';
import { render } from '@testing-library/react-native';
import { Screen } from '../../../components/ui';

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

describe('Screen keyboard avoidance', () => {
  const original = Platform.OS;
  afterEach(() => {
    Platform.OS = original;
  });

  test('iOS pads the content above the keyboard', () => {
    Platform.OS = 'ios';
    const { UNSAFE_getByType } = render(<Screen keyboardAvoiding><Text>body</Text></Screen>);
    expect(UNSAFE_getByType(KeyboardAvoidingView).props.behavior).toBe('padding');
  });

  test('Android shrinks the height instead of leaving behavior undefined', () => {
    Platform.OS = 'android';
    const { UNSAFE_getByType } = render(<Screen keyboardAvoiding><Text>body</Text></Screen>);
    expect(UNSAFE_getByType(KeyboardAvoidingView).props.behavior).toBe('height');
  });

  test('no KeyboardAvoidingView unless asked for', () => {
    const { UNSAFE_queryByType } = render(<Screen><Text>body</Text></Screen>);
    expect(UNSAFE_queryByType(KeyboardAvoidingView)).toBeNull();
  });
});

describe('Screen pull-to-refresh', () => {
  test('forwards refreshControl to the scroll view and remounts it when scrollKey changes', () => {
    const { RefreshControl } = require('react-native');
    const control = <RefreshControl refreshing={false} onRefresh={() => {}} />;
    const { getByTestId, UNSAFE_getByType, rerender } = render(
      <Screen refreshControl={control} scrollKey="A"><Text>body</Text></Screen>,
    );
    expect(UNSAFE_getByType(RefreshControl)).toBeTruthy();
    const first = getByTestId('screen-scroll');
    rerender(<Screen refreshControl={control} scrollKey="B"><Text>body</Text></Screen>);
    expect(getByTestId('screen-scroll')).not.toBe(first);
  });
});
