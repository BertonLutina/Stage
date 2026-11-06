import React from 'react';
import { Text, RefreshControl, StyleSheet } from 'react-native';
import { render } from '@testing-library/react-native';

let mockTokens;
jest.mock('../../../store/themeStore', () => ({
  __esModule: true,
  default: (selector) => selector({ tokens: mockTokens }),
}));
jest.mock('../../../components/theme/LiveDarkWallpaper', () => {
  const { View } = require('react-native');
  return { __esModule: true, default: () => <View testID="live-wallpaper" /> };
});

import Screen from '../../../components/ui/Screen';
import { guideFabClearance } from '../../../components/ui/metrics';

const flat = (node) => StyleSheet.flatten(node.props.style) || {};

describe('Screen (gradient background)', () => {
  beforeEach(() => {
    mockTokens = { bg: '#03153F', live: false, isDark: true };
  });

  test('non-live renders the Stage gradient (not a flat fill) with gutters and tab clearance', () => {
    const { getByTestId, queryByTestId } = render(
      <Screen testID="screen"><Text>body</Text></Screen>
    );

    expect(getByTestId('stage-bg')).toBeTruthy();
    expect(queryByTestId('live-wallpaper')).toBeNull();

    const content = flat(getByTestId('screen-content'));
    expect(content.paddingHorizontal).toBe(20);
    expect(content.paddingBottom).toBe(guideFabClearance(0));

    // Root keeps the spec fallback colour under the gradient.
    expect(flat(getByTestId('screen')).backgroundColor).toBe('#03153F');
  });

  test('live mode renders the wallpaper instead of the gradient', () => {
    mockTokens = { bg: '#03153F', live: true, isDark: true };
    const { getByTestId, queryByTestId } = render(
      <Screen testID="screen"><Text>body</Text></Screen>
    );

    expect(getByTestId('live-wallpaper')).toBeTruthy();
    expect(queryByTestId('stage-bg')).toBeNull();
  });

  test('forwards refreshControl to the scroll view', () => {
    const onRefresh = jest.fn();
    const { getByTestId } = render(
      <Screen refreshControl={<RefreshControl refreshing={false} onRefresh={onRefresh} />}>
        <Text>body</Text>
      </Screen>
    );
    expect(getByTestId('screen-scroll').props.refreshControl).toBeTruthy();
  });
});
