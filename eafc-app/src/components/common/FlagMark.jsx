import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { countryCodeToFlagEmoji, getCountryFlagColors, getPlayerNationality } from '@/lib/countryDisplay';

export default function FlagMark({ code, country, size = 18, accessibilityLabel }) {
  const resolved = code || getPlayerNationality({ country_code: code, country }).code;
  const colors = getCountryFlagColors(resolved || country);
  const emoji = countryCodeToFlagEmoji(resolved, country);
  const width = Math.round(size * 1.45);
  return (
    <View
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel || 'National flag'}
      style={{
        width,
        height: size,
        overflow: 'hidden',
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: 'rgba(255,255,255,0.28)',
        backgroundColor: '#0A1220',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <LinearGradient
        colors={colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      {emoji ? (
        <Text style={{ fontSize: Math.round(size * 0.86), lineHeight: size, textAlign: 'center' }}>
          {emoji}
        </Text>
      ) : null}
    </View>
  );
}
