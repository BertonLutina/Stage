jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
  removeItem: jest.fn(() => Promise.resolve()),
}));

jest.mock('nativewind', () => ({
  styled: (Component) => Component,
  useColorScheme: () => ({ colorScheme: 'dark' }),
  cssInterop: () => {},
  remapProps: () => {},
}));

jest.mock('react-native-safe-area-context', () => {
  const RN = jest.requireActual('react-native');
  return {
    SafeAreaProvider: ({ children }) => children,
    SafeAreaView: RN.View,
    useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
    initialWindowMetrics: {
      frame: { x: 0, y: 0, width: 390, height: 844 },
      insets: { top: 44, left: 0, bottom: 34, right: 0 },
    },
  };
});

jest.mock('react-native-webview', () => {
  const React = require('react');
  const { View, Text } = require('react-native');
  const MockWebView = (props) =>
    React.createElement(
      View,
      { style: props.style, testID: 'webview' },
      React.createElement(Text, null, props.source?.uri || '')
    );
  return { __esModule: true, default: MockWebView };
});

jest.mock('react-native-svg', () => {
  const RN = jest.requireActual('react-native');
  return {
    Svg: RN.View,
    Rect: RN.View,
    Circle: RN.View,
    Text: RN.Text,
    Image: RN.View,
    G: RN.View,
    Path: RN.View,
    Line: RN.View,
  };
});

jest.mock('@react-native-community/datetimepicker', () => {
  const React = require('react');
  const { View } = require('react-native');
  const MockPicker = (props) => React.createElement(View, { testID: 'datetimepicker', ...props });
  return { __esModule: true, default: MockPicker };
});

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: jest.fn(), goBack: jest.fn(), replace: jest.fn() }),
  useRoute: () => ({ params: {} }),
  NavigationContainer: ({ children }) => children,
  useFocusEffect: jest.fn(),
}));

jest.mock('socket.io-client', () => ({
  io: jest.fn(() => ({
    on: jest.fn(),
    emit: jest.fn(),
    disconnect: jest.fn(),
    join: jest.fn(),
  })),
}));
