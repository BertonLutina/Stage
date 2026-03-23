import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet, Linking } from 'react-native';
import { Slot, useRouter } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import '../../global.css';
import useAuthBootstrap from '../hooks/useAuthBootstrap';
import useNotificationsSocket from '../hooks/useNotificationsSocket';
import useThemeStore from '../store/themeStore';
import useToastStore from '../store/toastStore';
import GradientBackground from '../components/common/GradientBackground';
import Toast from '../components/common/Toast';

export default function RootLayout() {
  const router = useRouter();
  const { ready, user } = useAuthBootstrap();
  useNotificationsSocket(user?.id);
  const { initialize: initTheme } = useThemeStore();

  useEffect(() => {
    const sub = Linking.addEventListener('url', ({ url }) => {
      if (url.startsWith('stage://auth/callback')) {
        router.replace('/auth/callback?' + url.split('?')[1]);
      }
    });
    Linking.getInitialURL().then((url) => {
      if (url?.startsWith('stage://auth/callback')) {
        router.replace('/auth/callback?' + (url.split('?')[1] || ''));
      }
    });
    return () => sub.remove();
  }, []);
  const { visible, message, hide } = useToastStore();
  useEffect(() => {
    initTheme();
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar style="light" backgroundColor="transparent" translucent />
      <GradientBackground>
        <View className="flex-1" style={{ flex: 1 }}>
          <Slot />
          <Toast visible={visible} message={message} onHide={hide} />
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
