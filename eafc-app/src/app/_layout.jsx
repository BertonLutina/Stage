import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Slot } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import '../../global.css';
import useAuthBootstrap from '../hooks/useAuthBootstrap';
import useThemeStore from '../store/themeStore';
import GradientBackground from '../components/common/GradientBackground';

export default function RootLayout() {
  const { ready } = useAuthBootstrap();
  const { resolvedTheme, initialize: initTheme } = useThemeStore();
  const isDark = resolvedTheme === 'dark';

  useEffect(() => {
    initTheme();
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar style="light" backgroundColor="transparent" translucent />
      <GradientBackground>
        <View
          className={isDark ? 'dark flex-1' : 'flex-1'}
          style={{ flex: 1 }}
        >
          <Slot />
          {!ready && (
            <View style={[StyleSheet.absoluteFill, styles.loader]}>
              <ActivityIndicator size="large" color="#5FE3E8" />
            </View>
          )}
        </View>
      </GradientBackground>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loader: {
    backgroundColor: 'rgba(7,22,58,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
