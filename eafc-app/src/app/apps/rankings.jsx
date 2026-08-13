import React, { useEffect } from 'react';
import { useRouter } from 'expo-router';

export default function RankingsRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/apps/competitions');
  }, [router]);
  return null;
}
