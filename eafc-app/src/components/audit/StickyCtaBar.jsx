import React from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import useThemeStore from '@/store/themeStore';

/** Bottom sticky CTA stack matching audit mockups (above safe area). */
export default function StickyCtaBar({ children, testID }) {
  const tokens = useThemeStore((s) => s.tokens);
  const insets = useSafeAreaInsets();
  return (
    <View
      testID={testID}
      style={{
        position: 'absolute',
        left: 20,
        right: 20,
        bottom: Math.max(insets.bottom, 16) + 12,
        gap: 10,
        backgroundColor: 'transparent',
      }}
    >
      {children}
      {/* Soft fade behind CTAs so scroll content does not collide visually */}
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          left: -20,
          right: -20,
          bottom: -Math.max(insets.bottom, 16) - 12,
          height: 24,
          backgroundColor: tokens.bg,
          opacity: 0,
        }}
      />
    </View>
  );
}
