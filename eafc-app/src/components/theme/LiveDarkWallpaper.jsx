import React from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import useThemeStore from '@/store/themeStore';

/** Planted Live Dark photo. Must live inside the screen — native stacks hide ancestor backdrops. */
export default function LiveDarkWallpaper() {
  const liveDark = useThemeStore((s) => s.liveDark);
  const source = useThemeStore((s) => s.liveDarkSource);
  const fx = useThemeStore((s) => s.liveDarkFx);
  if (!liveDark || !source) return null;

  const overlayRaw = Number(fx?.overlay);
  const overlay = Number.isFinite(overlayRaw)
    ? Math.min(0.85, Math.max(0, overlayRaw))
    : 0.18;

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill} testID="live-dark-wallpaper">
      <Image
        source={source}
        resizeMode="cover"
        blurRadius={Math.max(0, Number(fx?.blur) || 0)}
        style={[StyleSheet.absoluteFill, styles.planted]}
      />
      <LinearGradient
        colors={['rgba(2,6,13,0.32)', 'transparent', 'rgba(2,6,13,0.48)']}
        locations={[0, 0.42, 1]}
        style={StyleSheet.absoluteFill}
      />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: `rgba(2,6,13,${overlay})` }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  planted: {
    width: '100%',
    height: '100%',
    transform: [{ scale: 1.08 }],
  },
});
