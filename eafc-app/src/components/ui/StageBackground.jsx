import React from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

/**
 * The Stage screen background (rebuild spec, 6 Nov 2026). Three layers, bottom
 * to top:
 *   1. horizontal base: #020C30 → #06306A → #020C30
 *   2. top-centre glow:  rgba(14,58,124,0.9) → transparent
 *   3. bottom-centre glow: transparent → rgba(0,82,140,0.95)
 *
 * React Native / expo-linear-gradient has no radial gradient and the project
 * ships no pre-rendered 3× background image, so the two centre glows are
 * approximated with vertical linear fades. Fidelity note is tracked in the
 * Section-2 report. Fills its parent; render it behind screen content.
 */
export default function StageBackground({ testID = 'stage-bg' }) {
  return (
    <View testID={testID} style={StyleSheet.absoluteFill} pointerEvents="none">
      <LinearGradient
        colors={['#020C30', '#06306A', '#020C30']}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={['rgba(14,58,124,0.9)', 'rgba(14,58,124,0)']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.35 }}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={['rgba(0,82,140,0)', 'rgba(0,82,140,0.95)']}
        start={{ x: 0.5, y: 0.5 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}
