import React from 'react';
import { View, Text, Image } from 'react-native';
import { useRouter } from 'expo-router';
import useThemeStore from '@/store/themeStore';
import { Screen, Button, BrandLogo } from '@/components/ui';

/** Faded stadium mark watermark, bottom-left, as in the Welcome mockup. */
const MARK = require('../../../assets/brand/stage-icon.png');

export default function WelcomeScreen() {
  const router = useRouter();
  const tokens = useThemeStore((s) => s.tokens);

  return (
    <Screen scroll={false} tabBar={false}>
      <Image
        source={MARK}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        pointerEvents="none"
        style={{
          position: 'absolute',
          left: -70,
          top: 150,
          width: 530,
          height: (530 * 220) / 461,
          opacity: 0.16,
          resizeMode: 'contain',
        }}
      />
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
            color: tokens.cyan,
            fontSize: 11,
            fontWeight: '600',
            letterSpacing: 11 * 0.12,
            textTransform: 'uppercase',
          }}
        >
          EA FC Pro Clubs
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
