import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet, Linking } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import '../../global.css';
import '@/lib/polyfillStorage';
import { hydrateStageStorage } from '../lib/polyfillStorage';
import { FONT_EA_SPORTS } from '../lib/fonts';
import useAuthBootstrap from '../hooks/useAuthBootstrap';
import useNotificationsSocket from '../hooks/useNotificationsSocket';
import { SocketProvider } from '@/lib/SocketContext';
import useOneSignal from '../hooks/useOneSignal';
import useThemeStore from '../store/themeStore';
import useToastStore from '../store/toastStore';
import { ThemeProvider, DarkTheme } from '@react-navigation/native';
import GradientBackground from '../components/common/GradientBackground';
import Toast from '../components/common/Toast';

const NAV_THEME = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: 'transparent',
    card: 'transparent',
  },
};

export default function RootLayout() {
  const router = useRouter();
  const { ready, user } = useAuthBootstrap();
  useNotificationsSocket(user?.id);
  useOneSignal(user);
  const { initialize: initTheme } = useThemeStore();
  const statusStyle = useThemeStore((s) => (s.tokens.isDark ? 'light' : 'dark'));
  const [fontsLoaded] = useFonts({
    [FONT_EA_SPORTS]: require('../assets/fonts/EASPORTS15.ttf'),
  });

  useEffect(() => {
    hydrateStageStorage().catch(() => {});
  }, []);

  useEffect(() => {
    const openAuthCallback = (url) => {
      if (!url || !/auth\/callback/i.test(url)) return;
      const query = url.includes('?') ? url.slice(url.indexOf('?') + 1) : '';
      router.replace(query ? `/auth/callback?${query}` : '/auth/callback');
    };

    const sub = Linking.addEventListener('url', ({ url }) => openAuthCallback(url));
    Linking.getInitialURL().then(openAuthCallback).catch(() => {});
    return () => sub.remove();
  }, [router]);
  const { visible, message, hide } = useToastStore();
  useEffect(() => {
    initTheme();
  }, []);

  const bootReady = ready && fontsLoaded;

  return (
    <SocketProvider userId={user?.id}>
    <SafeAreaProvider>
      <StatusBar style={statusStyle} backgroundColor="transparent" translucent />
      <GradientBackground>
        <ThemeProvider value={NAV_THEME}>
        <View className="flex-1" style={{ flex: 1, backgroundColor: 'transparent' }}>
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: 'transparent' },
              animation: 'slide_from_right',
            }}
          >
            <Stack.Screen name="index" />
            <Stack.Screen name="(tabs)" options={{ animation: 'none', gestureEnabled: false }} />
            <Stack.Screen name="auth" options={{ animation: 'none' }} />
            <Stack.Screen name="apps" />
            <Stack.Screen name="teams" />
            <Stack.Screen name="social" />
          </Stack>
          <Toast visible={visible} message={message} onHide={hide} />
          {!bootReady && (
            <View style={[StyleSheet.absoluteFill, styles.loader]}>
              <ActivityIndicator size="large" color="#5FE3E8" />
            </View>
          )}
        </View>
        </ThemeProvider>
      </GradientBackground>
    </SafeAreaProvider>
    </SocketProvider>
  );
}

const styles = StyleSheet.create({
  loader: {
    backgroundColor: 'rgba(7,22,58,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
