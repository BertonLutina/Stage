import React, { useEffect } from 'react';
import { View, Linking } from 'react-native';
import { Stack, useRouter, ThemeProvider, DarkTheme } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
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
import GradientBackground from '../components/common/GradientBackground';
import Toast from '../components/common/Toast';
import PageWalkthrough from '../components/onboarding/PageWalkthrough';
import SplashOverlay from '../components/common/SplashOverlay';

// Hold the native splash until SplashOverlay has painted; it hides itself then.
SplashScreen.preventAutoHideAsync().catch(() => {});
// Cross-fade the native splash out instead of cutting to the JS overlay.
// `fade` is iOS-only; on Android this is a harmless no-op.
SplashScreen.setOptions({ fade: true, duration: 300 });

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
    const openIncomingUrl = (url) => {
      if (!url) return;
      const query = url.includes('?') ? url.slice(url.indexOf('?') + 1) : '';
      if (/auth\/callback/i.test(url)) {
        router.replace(query ? `/auth/callback?${query}` : '/auth/callback');
        return;
      }
      if (/apps\/store/i.test(url) || /store\/mobile-return/i.test(url)) {
        router.replace(query ? `/apps/store?${query}` : '/apps/store');
      }
    };

    const sub = Linking.addEventListener('url', ({ url }) => openIncomingUrl(url));
    Linking.getInitialURL().then(openIncomingUrl).catch(() => {});
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
          {user ? <PageWalkthrough /> : null}
          <SplashOverlay visible={!bootReady} />
        </View>
        </ThemeProvider>
      </GradientBackground>
    </SafeAreaProvider>
    </SocketProvider>
  );
}

