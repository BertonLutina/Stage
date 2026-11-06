import React from 'react';
import { View, Pressable } from 'react-native';
import useThemeStore from '@/store/themeStore';

const TRACK_W = 52;
const TRACK_H = 30;
const THUMB = 24;

export default function Toggle({
  value,
  onValueChange,
  accessibilityLabel,
  testID,
  disabled = false,
}) {
  const tokens = useThemeStore((s) => s.tokens);
  const on = value === true;

  return (
    <Pressable
      testID={testID}
      accessibilityRole="switch"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ checked: on, disabled: disabled === true }}
      disabled={disabled === true}
      onPress={() => {
        if (disabled === true) return;
        if (onValueChange) onValueChange(!on);
      }}
      hitSlop={{ top: 7, bottom: 7, left: 4, right: 4 }}
      style={{
        width: TRACK_W,
        height: TRACK_H,
        borderRadius: TRACK_H / 2,
        borderWidth: 1,
        borderColor: on ? tokens.cyan : tokens.borderStrong,
        backgroundColor: on ? tokens.cyan : tokens.border,
        justifyContent: 'center',
        alignItems: on ? 'flex-end' : 'flex-start',
        paddingHorizontal: 2,
        opacity: disabled === true ? 0.5 : 1,
      }}
    >
      <View
        style={{
          width: THUMB,
          height: THUMB,
          borderRadius: THUMB / 2,
          backgroundColor: on ? tokens.onCyan : tokens.textSoft,
        }}
      />
    </Pressable>
  );
}
