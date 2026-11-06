import React from 'react';
import { View, Text } from 'react-native';
import useThemeStore from '@/store/themeStore';

const SIZE = 28;

/** Recent-form pill: W success, D muted, L danger. */
export default function FormBadge({ result, testID }) {
  const tokens = useThemeStore((s) => s.tokens);

  let fg = tokens.muted;
  let bg = tokens.border;
  if (result === 'W') {
    fg = tokens.success;
    bg = tokens.successBg;
  } else if (result === 'L') {
    fg = tokens.danger;
    bg = tokens.dangerBg;
  }

  return (
    <View
      testID={testID}
      style={{
        width: SIZE,
        height: SIZE,
        borderRadius: SIZE / 2,
        backgroundColor: bg,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text numberOfLines={1} style={{ color: fg, fontSize: 12, fontWeight: '700' }}>
        {result}
      </Text>
    </View>
  );
}
