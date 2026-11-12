import React from 'react';
import { View, Text } from 'react-native';
import { useRouter } from 'expo-router';
import useThemeStore from '@/store/themeStore';
import { Screen, Button, BrandLogo } from '@/components/ui';

export default function WelcomeScreen() {
  const router = useRouter();
  const tokens = useThemeStore((s) => s.tokens);

  return (
    <Screen scroll={false} tabBar={false} authBackdrop>
      <View
        style={{
          flex: 1,
          justifyContent: 'flex-end',
          gap: 14,
          paddingHorizontal: 4,
          paddingBottom: 18,
        }}
      >
        <Text
          style={{
            color: '#5FE3E8',
            fontSize: 15,
            fontWeight: '600',
            letterSpacing: 15 * 0.12,
            textTransform: 'uppercase',
          }}
        >
          Welcome to
        </Text>
        <BrandLogo variant="lockup" width={320} style={{ maxWidth: '100%', alignSelf: 'flex-start' }} />
        <Text style={{ color: tokens.textSoft, fontSize: 17, lineHeight: 25, marginBottom: 20 }}>
          Your club, your contracts, your tournaments. All in one place.
        </Text>
        <Button title="Create Account" onPress={() => router.push('/auth/signupscreen')} />
        <Button
          title="I already have an account"
          variant="secondary"
          onPress={() => router.push('/auth/loginscreen')}
        />
      </View>
    </Screen>
  );
}
