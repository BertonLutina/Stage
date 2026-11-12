import React, { useEffect, useRef } from 'react';
import { Animated, View } from 'react-native';
import useThemeStore from '@/store/themeStore';
import { CARD_PADDING } from './metrics';

/** One pulsing placeholder block. */
export function SkeletonBlock({ width = '100%', height = 14, radius = 8, style }) {
  const tokens = useThemeStore((s) => s.tokens);
  const opacity = useRef(new Animated.Value(0.45)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.9, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.45, duration: 700, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[{ width, height, borderRadius: radius, backgroundColor: tokens.border, opacity }, style]}
    />
  );
}

/** Card-shaped skeleton: a title line and `lines` body lines. */
export function SkeletonCard({ lines = 2, testID = 'skeleton-card' }) {
  const tokens = useThemeStore((s) => s.tokens);
  return (
    <View
      testID={testID}
      style={{
        borderRadius: tokens.cardRadius,
        borderWidth: 1,
        borderColor: tokens.border,
        backgroundColor: tokens.card,
        padding: CARD_PADDING,
        gap: 10,
      }}
    >
      <SkeletonBlock width="55%" height={16} />
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonBlock key={i} width={i === lines - 1 ? '40%' : '90%'} height={12} />
      ))}
    </View>
  );
}

/** A stack of card skeletons, matching the shape of list screens while they load. */
export default function SkeletonList({ count = 3, lines = 2 }) {
  return (
    <View testID="skeleton-list" accessibilityLabel="Loading" style={{ gap: 12 }}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} lines={lines} />
      ))}
    </View>
  );
}
