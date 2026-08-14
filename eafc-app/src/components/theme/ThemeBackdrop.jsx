import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import useThemeStore from '@/store/themeStore';
import LiveDarkWallpaper from '@/components/theme/LiveDarkWallpaper';

export default function ThemeBackdrop({ children, style }) {
  const tokens = useThemeStore((s) => s.tokens);
  const liveDark = useThemeStore((s) => s.liveDark);

  return (
    <View style={[{ flex: 1, backgroundColor: tokens.bg }, style]}>
      {liveDark ? (
        <LiveDarkWallpaper />
      ) : (
        <>
          <LinearGradient
            colors={[tokens.bg, '#07121F', tokens.bg]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <LinearGradient
            colors={tokens.wash}
            locations={[0, 0.45, 1]}
            start={{ x: 0.1, y: 0 }}
            end={{ x: 0.95, y: 0.55 }}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />
        </>
      )}
      <View style={styles.content}>{children}</View>
    </View>
  );
}

export function ThemedFill({ children, style }) {
  const tokens = useThemeStore((s) => s.tokens);
  const liveDark = useThemeStore((s) => s.liveDark);
  return (
    <View style={[{ flex: 1, backgroundColor: liveDark ? 'transparent' : tokens.bg }, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    zIndex: 1,
  },
});
