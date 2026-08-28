import React from 'react';
import { render } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import useToastStore from '../../store/toastStore';

jest.mock('react-native-screens', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    FullWindowOverlay: ({ children }) =>
      React.createElement(View, { testID: 'full-window-overlay' }, children),
  };
});

jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return {
    Ionicons: ({ name }) => React.createElement(Text, { testID: `icon-${name}` }, name),
  };
});

const Toast = require('../../components/common/Toast').default;

function renderToast() {
  return render(
    <SafeAreaProvider>
      <Toast />
    </SafeAreaProvider>,
  );
}

describe('Toast overlay', () => {
  beforeEach(() => {
    useToastStore.setState({ visible: false, message: '', queue: [] });
  });

  test('renders a STAGE HUD banner above the native stack', () => {
    useToastStore.setState({ visible: true, message: 'Kickoff · Home FC vs Away FC is underway.', queue: [] });
    const { getByTestId, getByText } = renderToast();
    expect(getByTestId('full-window-overlay')).toBeTruthy();
    expect(getByTestId('stage-toast-layer')).toBeTruthy();
    expect(getByTestId('stage-toast')).toBeTruthy();
    expect(getByText('STAGE')).toBeTruthy();
    expect(getByText('Kickoff')).toBeTruthy();
    expect(getByText('Home FC vs Away FC is underway.')).toBeTruthy();
  });

  test('stays unmounted until a toast is queued', () => {
    const { queryByTestId } = renderToast();
    expect(queryByTestId('stage-toast')).toBeNull();
  });
});
