import { useEffect, useState } from 'react';
import { useRouter, useSegments } from 'expo-router';
import useAuthStore from '../store/authStore';
import { isOnboardingComplete } from '../services/playerIdentityService';

export default function useAuthBootstrap() {
  const router = useRouter();
  const segments = useSegments();
  const { user, initialize } = useAuthStore();
  const [ready, setReady] = useState(false);
  const [onboardingComplete, setOnboardingComplete] = useState(false);

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
        if (!cancelled) setOnboardingComplete(false);
        return;
      }
      const complete = await isOnboardingComplete(user.id);
      if (!cancelled) setOnboardingComplete(complete);
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  useEffect(() => {
    if (!ready) return;
    const inAuthGroup = segments[0] === 'auth';
    const authScreen = segments[1];
    const inSetupFlow = ['gamertagsetup', 'platformselection', 'positionselection', 'clubsetup'].includes(authScreen);

    console.log('user', user);
    console.log('inAuthGroup', inAuthGroup);
    console.log('inSetupFlow', inSetupFlow);
    console.log('onboardingComplete', onboardingComplete);

    if (!user && !inAuthGroup) {
      router.replace('/auth/welcome');
    } else if (!user && inSetupFlow) {
      router.replace('/auth/loginscreen');
    } else if (user && !onboardingComplete && !inSetupFlow) {
      router.replace('/auth/gamertagsetup');
    } else if (user && onboardingComplete && inAuthGroup) {
      router.replace('/(tabs)/dashboard');
    }
  }, [ready, user, onboardingComplete, segments, router]);

  return { ready, user, onboardingComplete };
}

