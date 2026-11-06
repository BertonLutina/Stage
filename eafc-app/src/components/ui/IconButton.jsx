import React, { useEffect } from 'react';
import { Pressable } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import useThemeStore from '@/store/themeStore';
import { ICON_BUTTON_SIZE, ICON_BUTTON_RADIUS, ICON_SIZE } from './metrics';

export default function IconButton({ icon, onPress, accessibilityLabel, testID }) {
  const tokens = useThemeStore((s) => s.tokens);

  useEffect(() => {
    if (__DEV__ && !accessibilityLabel) {
      console.error(`IconButton "${icon}" is missing an accessibilityLabel.`);
    }
  }, [accessibilityLabel, icon]);

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={({ pressed }) => ({
        width: ICON_BUTTON_SIZE,
        height: ICON_BUTTON_SIZE,
        borderRadius: ICON_BUTTON_RADIUS,
        borderWidth: 1,
        borderColor: tokens.border,
        backgroundColor: pressed ? tokens.cardHi : tokens.card,
        alignItems: 'center',
        justifyContent: 'center',
      })}
    >
      <Ionicons name={icon} size={ICON_SIZE} color={tokens.text} />
    </Pressable>
  );
}
