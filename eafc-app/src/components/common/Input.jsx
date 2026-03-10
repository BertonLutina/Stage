import React from 'react';
import { View, TextInput, Text } from 'react-native';
import useThemeStore from '../../store/themeStore';

export default function Input({ label, error, className = '', ...props }) {
  const isDark = useThemeStore((s) => s.theme) === 'dark';

  return (
    <View className={`mb-4 ${className}`}>
      {label ? (
        <Text className={`text-sm font-semibold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          {label}
        </Text>
      ) : null}
      <TextInput
        className={`bg-card border rounded-xl px-4 py-3 text-base ${
          error ? 'border-danger' : 'border-white/40'
        } ${isDark ? 'text-white' : 'text-gray-900'}`}
        placeholderTextColor={isDark ? '#9CA3AF' : '#6B7280'}
        {...props}
      />
      {error ? <Text className="text-danger text-xs mt-1">{error}</Text> : null}
    </View>
  );
}
