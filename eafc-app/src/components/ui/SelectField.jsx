import React from 'react';
import { View, Text, Pressable } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import useThemeStore from '@/store/themeStore';
import { INPUT_HEIGHT, INPUT_RADIUS, ICON_SIZE } from './metrics';

/**
 * Looks like TextField, opens a picker on press (the caller owns the picker).
 * `accessibilityLabel` overrides the label as the control's spoken name (e.g. "Language, English").
 * When it is supplied the value is not announced a second time via accessibilityValue.
 * `open` flips the chevron up while the caller's picker is showing.
 */
export default function SelectField({
  label,
  value,
  placeholder,
  onPress,
  testID,
  accessibilityLabel,
  open = false,
}) {
  const tokens = useThemeStore((s) => s.tokens);
  const hasValue = value != null && value !== '';

  return (
    <View>
      {label ? (
        <Text
          numberOfLines={1}
          ellipsizeMode="tail"
          style={{ color: tokens.textSoft, fontSize: 13, fontWeight: '600', marginBottom: 6 }}
        >
          {label}
        </Text>
      ) : null}
      <Pressable
        testID={testID}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel || label}
        accessibilityValue={
          hasValue && !accessibilityLabel ? { text: String(value) } : undefined
        }
        onPress={onPress}
        style={({ pressed }) => ({
          height: INPUT_HEIGHT,
          borderRadius: INPUT_RADIUS,
          borderWidth: 1,
          borderColor: tokens.border,
          backgroundColor: tokens.bgDeep,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          paddingHorizontal: 16,
          opacity: pressed ? 0.85 : 1,
        })}
      >
        <Text
          numberOfLines={1}
          ellipsizeMode="tail"
          style={{ flex: 1, fontSize: 15, color: hasValue ? tokens.text : tokens.muted }}
        >
          {hasValue ? value : placeholder}
        </Text>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={ICON_SIZE} color={tokens.muted} />
      </Pressable>
    </View>
  );
}
