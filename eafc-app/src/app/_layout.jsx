import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Slot } from 'expo-router';
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
  const { ready, user } = useAuthBootstrap();
  useNotificationsSocket(user?.id);
  const { resolvedTheme, initialize: initTheme } = useThemeStore();
  const { visible, message, hide } = useToastStore();
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
