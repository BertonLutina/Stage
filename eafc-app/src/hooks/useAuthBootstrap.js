import { useEffect, useState } from 'react';
import { useRouter, useSegments } from 'expo-router';
import useAuthStore from '../store/authStore';
import { shouldShowOnboarding, hasCompletedOnboarding } from '../services/onboardingService';

export default function useAuthBootstrap() {
  const router = useRouter();
  const segments = useSegments();
  const { user, initialize } = useAuthStore();
  const [ready, setReady] = useState(false);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  useEffect(() => {
    (async () => {
      await initialize();
      setReady(true);
    })();
  }, [initialize]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!user?.id) {
        if (!cancelled) setNeedsOnboarding(false);
        return;
      }
      const show = await shouldShowOnboarding(user);
      if (!cancelled) setNeedsOnboarding(show);
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id, segments]);

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;

    (async () => {
      const inAuthGroup = segments[0] === 'auth';
      const authScreen = segments[1];
      const inOnboarding = authScreen === 'onboarding';
      const inLegacySetup = [
        'gamertagsetup',
        'platformselection',
        'positionselection',
        'clubsetup',
        'onboarding',
      ].includes(authScreen);

      if (!user && !inAuthGroup) {
        router.replace('/auth/welcome');
        return;
      }
      if (!user && inLegacySetup) {
        router.replace('/auth/loginscreen');
        return;
      }
      if (!user) return;

      // Always re-check before forcing onboarding (avoids bounce after tutorial complete)
      const show = await shouldShowOnboarding(user);
      if (cancelled) return;
      setNeedsOnboarding(show);

      if (show && !inOnboarding) {
        router.replace('/auth/onboarding');
        return;
      }
      if (!show && inAuthGroup && authScreen !== 'callback') {
        router.replace('/(tabs)/dashboard');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [ready, user, segments, router]);

  return {
    ready,
    user,
    onboardingComplete: user?.id ? !needsOnboarding : false,
    needsOnboarding,
  };
}

export { hasCompletedOnboarding };
