import React from 'react';
import { View, Text } from 'react-native';
import useThemeStore from '@/store/themeStore';

/** 11px / 600 / uppercase / 0.12em / muted, with an optional right-hand slot. */
export default function SectionLabel({ children, right }) {
  const tokens = useThemeStore((s) => s.tokens);
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
      }}
    >
      <Text
        numberOfLines={1}
        style={{
          flexShrink: 1,
          color: tokens.muted,
          fontSize: 11,
          fontWeight: '600',
          letterSpacing: 11 * 0.12,
          textTransform: 'uppercase',
        }}
      >
        {children}
      </Text>
      {right || null}
    </View>
  );
}
