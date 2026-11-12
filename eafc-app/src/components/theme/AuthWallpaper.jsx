import React from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import useThemeStore from '@/store/themeStore';
import { AUTH_BG_OVERLAY_MAX } from '@/lib/authBackground';
import StageBackground from '@/components/ui/StageBackground';

/**
 * Welcome / Sign in / Sign up backdrop. Own system (authBg* in themeStore) —
 * not Live Dark. Falls back to StageBackground when preference is default/reset.
 */
export default function AuthWallpaper({ testID = 'auth-wallpaper' }) {
  const active = useThemeStore((s) => s.authBgActive);
  const source = useThemeStore((s) => s.authBgSource);
  const fx = useThemeStore((s) => s.authBgFx);

  if (!active || !source) {
    return <StageBackground testID={testID} />;
  }

  const overlayRaw = Number(fx?.overlay);
  const overlay = Number.isFinite(overlayRaw)
    ? Math.min(AUTH_BG_OVERLAY_MAX, Math.max(0, overlayRaw))
    : 0.45;

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill} testID={testID}>
      <Image
        source={source}
        resizeMode="cover"
        blurRadius={Math.max(0, Number(fx?.blur) || 0)}
        style={[StyleSheet.absoluteFill, styles.planted]}
      />
      <LinearGradient
        colors={['rgba(3,21,63,0.35)', 'transparent', 'rgba(3,21,63,0.55)']}
        locations={[0, 0.4, 1]}
        style={StyleSheet.absoluteFill}
      />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: `rgba(3,21,63,${overlay})` }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  planted: {
    width: '100%',
    height: '100%',
    transform: [{ scale: 1.06 }],
  },
});
