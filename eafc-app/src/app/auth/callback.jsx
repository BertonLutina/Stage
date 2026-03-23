import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import STText from '../../components/common/STText';
import useAuthStore from '../../store/authStore';

export default function AuthCallbackScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const { setUserFromOAuth } = useAuthStore();
  const [status, setStatus] = useState('processing');

  useEffect(() => {
    const safeParams = params && typeof params === 'object' ? params : {};
    const accessToken = safeParams.accessToken ?? safeParams.access_token;
    const refreshToken = safeParams.refreshToken ?? safeParams.refresh_token;
    const userParam = safeParams.user;
    const error = safeParams.error;

    if (error) {
      setStatus('error');
      setTimeout(() => router.replace('/auth/loginscreen'), 2000);
      return;
    }

    if (!accessToken || !refreshToken) {
      setStatus('error');
      setTimeout(() => router.replace('/auth/loginscreen'), 2000);
      return;
    }

    let user = null;
    try {
      if (userParam && typeof userParam === 'string') {
        user = JSON.parse(decodeURIComponent(userParam));
      }
    } catch (_) {}

    setUserFromOAuth(accessToken, refreshToken, user).then(() => {
      setStatus('success');
      router.replace('/(tabs)/dashboard');
    }).catch(() => {
      setStatus('error');
      setTimeout(() => router.replace('/auth/loginscreen'), 2000);
    });
  }, [params]);

  return (
    <View className="flex-1 items-center justify-center px-6">
      <STText className="text-white text-center">
        {status === 'processing' ? 'Signing you in...' : status === 'error' ? 'Something went wrong. Redirecting...' : 'Success!'}
      </STText>
    </View>
  );
}
