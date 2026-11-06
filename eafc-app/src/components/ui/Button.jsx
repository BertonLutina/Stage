import React from 'react';
import { Pressable, Text, View, ActivityIndicator } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import useThemeStore from '@/store/themeStore';
import { BUTTON_HEIGHT, BUTTON_RADIUS, ICON_SIZE } from './metrics';

function variantColors(tokens, variant, pressed) {
  if (variant === 'secondary') {
    return { bg: 'transparent', border: tokens.cyan, fg: tokens.cyan };
  }
  if (variant === 'danger') {
    return { bg: 'transparent', border: tokens.danger, fg: tokens.danger };
  }
  const bg = pressed ? tokens.cyanHi : tokens.cyan;
  return { bg, border: bg, fg: tokens.onCyan };
}

export default function Button({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  icon,
  accessibilityLabel,
  testID,
}) {
  const tokens = useThemeStore((s) => s.tokens);
  const inert = disabled || loading;

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || title}
      accessibilityState={{ disabled: inert, busy: loading }}
      disabled={inert}
      onPress={inert ? undefined : onPress}
      style={({ pressed }) => {
        const c = variantColors(tokens, variant, pressed);
        return {
          height: BUTTON_HEIGHT,
          borderRadius: BUTTON_RADIUS,
          borderWidth: 1,
          borderColor: c.border,
          backgroundColor: c.bg,
          alignSelf: 'stretch',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          paddingHorizontal: 16,
          opacity: disabled ? 0.5 : 1,
        };
      }}
    >
      {({ pressed }) => {
        const c = variantColors(tokens, variant, pressed);
        if (loading) return <ActivityIndicator color={c.fg} />;
        return (
          <>
            {icon ? <Ionicons name={icon} size={ICON_SIZE} color={c.fg} /> : null}
            <View style={{ flexShrink: 1 }}>
              <Text
                numberOfLines={1}
                ellipsizeMode="tail"
                style={{
                  color: c.fg,
                  fontSize: 15,
                  fontWeight: variant === 'primary' ? '700' : '600',
                }}
              >
                {title}
              </Text>
            </View>
          </>
        );
      }}
    </Pressable>
  );
}
