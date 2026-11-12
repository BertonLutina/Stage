import React from 'react';
import { ActivityIndicator, Pressable, Text } from 'react-native';
import useThemeStore from '@/store/themeStore';
import { BUTTON_HEIGHT } from '@/components/ui/metrics';

/** Green primary CTA used on Report / Confirm mockups (does not touch shared Button). */
export default function SuccessButton({
  title,
  onPress,
  loading = false,
  disabled = false,
  accessibilityLabel,
  testID,
}) {
  const tokens = useThemeStore((s) => s.tokens);
  const inert = disabled || loading;
  const bg = tokens.success;
  const fg = tokens.bgDeep || tokens.onCyan;

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || title}
      accessibilityState={{ disabled: inert, busy: loading }}
      disabled={inert}
      onPress={inert ? undefined : onPress}
      style={({ pressed }) => ({
        height: BUTTON_HEIGHT,
        borderRadius: 14,
        backgroundColor: bg,
        opacity: pressed && !inert ? 0.9 : (disabled ? 0.5 : 1),
        alignSelf: 'stretch',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 16,
      })}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <Text
          numberOfLines={1}
          style={{
            color: fg,
            fontSize: 15,
            fontWeight: '800',
            textTransform: 'uppercase',
            letterSpacing: 0.6,
          }}
        >
          {title}
        </Text>
      )}
    </Pressable>
  );
}
