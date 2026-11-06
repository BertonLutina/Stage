import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import useThemeStore from '@/store/themeStore';

/**
 * Placeholder for the legacy onboarding route screens (platform/position/
 * gamertag/club), now folded into the combined flow at /auth/onboarding.
 * Redirects there and shows a brief themed spinner so old deep links and
 * notification targets land in the live flow instead of a dead screen.
 */
export default function OnboardingRedirect() {
  const router = useRouter();
  const tokens = useThemeStore((s) => s.tokens);
  useEffect(() => {
    router.replace('/auth/onboarding');
  }, [router]);
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: tokens.bg }}>
      <ActivityIndicator color={tokens.cyan} />
    </View>
  );
}
