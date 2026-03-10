import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './navigation/AppNavigator';
import useAuthStore from './store/authStore';
import '../global.css';

export default function App() {
  const initialize = useAuthStore((s) => s.initialize);

  useEffect(() => {
    initialize();
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar style="light" backgroundColor="#0F0F0F" />
      <AppNavigator />
    </SafeAreaProvider>
  );
}
