// GradientBackground.jsx
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import useColorSchemeColors from '../../hooks/useColorSchemeColors';

export default function GradientBackground({ children, style, colors, start, end }) {
  const { isDark } = useColorSchemeColors();
  const resolvedColors = colors || (isDark
    ? ['#02091B', '#07163A', '#02091B']
    : ['#FFFFFF', '#EEF6FC', '#E0EFF9']);
  const overlayColors = isDark
    ? ['rgba(30, 52, 115,0.22)', 'transparent']
    : ['rgba(95, 227, 232,0.18)', 'transparent'];

  return (
    <View style={styles.fill}>
      <LinearGradient
        colors={resolvedColors}
        start={start || { x: 0.5, y: 0 }}
        end={end || { x: 0.5, y: 0.4 }}
        style={[styles.fill, style]}
      >
        {/* Optional: subtle radial “spotlight” using another gradient */}
        <LinearGradient
          colors={overlayColors}
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