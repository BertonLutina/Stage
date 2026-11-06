import React from 'react';
import { Pressable, View, Text } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import useThemeStore from '@/store/themeStore';
import { CHIP_HEIGHT, CHIP_RADIUS } from './metrics';

export default function Chip({ label, active = false, onPress, icon, testID }) {
  const tokens = useThemeStore((s) => s.tokens);
  const fg = active ? tokens.onCyan : tokens.textSoft;

  const style = {
    height: CHIP_HEIGHT,
    borderRadius: CHIP_RADIUS,
    borderWidth: 1,
    borderColor: active ? tokens.cyan : tokens.border,
    backgroundColor: active ? tokens.cyan : tokens.card,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    flexShrink: 1,
    gap: 6,
    paddingHorizontal: 14,
  };

  const content = (
    <>
      {icon ? <Ionicons name={icon} size={16} color={fg} /> : null}
      <Text
        numberOfLines={1}
        ellipsizeMode="tail"
        style={{ color: fg, fontSize: 13, fontWeight: '600', flexShrink: 1 }}
      >
        {label}
      </Text>
    </>
  );

  // A static chip is a label, not a disabled button: keep it out of the button role.
  if (!onPress) {
    return (
      <View testID={testID} accessibilityState={active ? { selected: true } : undefined} style={style}>
        {content}
      </View>
    );
  }

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      hitSlop={{ top: 5, bottom: 5 }}
      style={style}
    >
      {content}
    </Pressable>
  );
}
