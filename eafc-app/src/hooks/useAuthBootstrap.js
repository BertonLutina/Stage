import { useEffect, useState } from 'react';
import { useRouter, useSegments } from 'expo-router';
import useAuthStore from '../store/authStore';

export default function useAuthBootstrap() {
  const router = useRouter();
  const segments = useSegments();
  const { user, initialize } = useAuthStore();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      await initialize();
      setReady(true);
    })();
  }, [initialize]);

  useEffect(() => {
    if (!ready) return;
    const inAuthGroup = segments[0] === 'auth';

    if (!user && !inAuthGroup) {
      router.replace('/auth/loginscreen');
    } else if (user && inAuthGroup) {
      router.replace('/(tabs)/social/feedscreen');
    }
  }, [ready, user, segments, router]);

  return { ready, user };
}

