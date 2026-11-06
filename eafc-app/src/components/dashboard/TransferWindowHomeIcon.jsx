import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import useThemeStore from '@/store/themeStore';

/** Transfer window open marker: a success-green dot next to the gamertag. 44pt hit area via hitSlop. */
export default function TransferWindowHomeIcon({ onPress }) {
  const tokens = useThemeStore((s) => s.tokens);
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      hitSlop={{
        top: 8, bottom: 8, left: 8, right: 8,
      }}
      accessibilityRole="button"
      accessibilityLabel="Transfers"
    >
      <View style={[styles.button, { backgroundColor: tokens.success }]}>
        <Ionicons name="swap-horizontal-outline" size={18} color={tokens.bgDeep} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
