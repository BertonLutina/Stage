import React from 'react';
import { View, Pressable } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import TextField from '@/components/ui/TextField';
import useThemeStore from '../../store/themeStore';

/** Prop-compatible wrapper around ui/TextField, keeping the optional password toggle. */
export default function Input({
  label,
  error,
  className = '',
  onTogglePassword,
  color,
  secureTextEntry,
  toggleAccessibilityLabel,
  ...props
}) {
  const tokens = useThemeStore((s) => s.tokens);
  const showPasswordToggle = onTogglePassword != null;

  const toggle = showPasswordToggle ? (
    <Pressable
      onPress={onTogglePassword}
      accessibilityRole="button"
      accessibilityLabel={
        toggleAccessibilityLabel || (secureTextEntry ? 'Show password' : 'Hide password')
      }
      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}
    >
      <Ionicons
        name={secureTextEntry ? 'eye-outline' : 'eye-off-outline'}
        size={22}
        color={tokens.muted}
      />
    </Pressable>
  ) : null;

  return (
    <View className={`mb-4 ${className}`}>
      <TextField
        label={label}
        error={error}
        labelColor={color}
        secureTextEntry={secureTextEntry}
        right={toggle}
        {...props}
      />
    </View>
  );
}
