import React, { useEffect } from 'react';
import { View } from 'react-native';
import { Slot } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import '../../global.css';
import useAuthBootstrap from '../hooks/useAuthBootstrap';
import useThemeStore from '../store/themeStore';

export default function RootLayout() {
  const { ready } = useAuthBootstrap();
  const { theme, initialize: initTheme } = useThemeStore();
  const isDark = theme === 'dark';

  useEffect(() => {
    initTheme();
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar
        style={isDark ? 'light' : 'dark'}
        backgroundColor={isDark ? '#07163A' : '#F9FAFB'}
      />
      <View
        className={isDark ? 'dark flex-1' : 'flex-1'}
        style={{ flex: 1, backgroundColor: isDark ? '#07163A' : '#F9FAFB' }}
      >
        {ready ? <Slot /> : null}
      </View>
    </SafeAreaProvider>
  );
}
