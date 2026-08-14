import React from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import ThemeBackdrop from '../theme/ThemeBackdrop';
import useThemeStore from '../../store/themeStore';

export default function GradientBackground({ children, style, colors, start, end }) {
  const tokens = useThemeStore((s) => s.tokens);
  if (!colors) {
    return <ThemeBackdrop style={style}>{children}</ThemeBackdrop>;
  }

  return (
    <View style={styles.fill}>
      <LinearGradient
        colors={colors}
        start={start || { x: 0.5, y: 0 }}
        end={end || { x: 0.5, y: 0.4 }}
        style={[styles.fill, style]}
      >
        <LinearGradient
          colors={tokens.isDark ? ['rgba(30, 52, 115,0.22)', 'transparent'] : ['rgba(14, 116, 144,0.12)', 'transparent']}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 0.9, y: 1 }}
          style={styles.overlay}
        />
        {children}
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
});
