import React from 'react';
import { View, TextInput } from 'react-native';
import STText from './STText';
import useThemeStore from '../../store/themeStore';

export default function Input({ label, error, className = '', ...props }) {
  const isDark = useThemeStore((s) => s.resolvedTheme) === 'dark';

  return (
    <View className={`mb-4 ${className}`}>
      {label ? (
        <STText className="text-sm font-semibold mb-1 dark:text-white text-gray-100">
          {label}
        </STText>
      ) : null}
      <TextInput
        className={`bg-card border rounded-xl px-4 py-3 text-base ${
          error ? 'border-danger' : 'border-white/40'
        } dark:text-white text-gray-100`}
        placeholderTextColor={isDark ? 'white' : 'white'}
        {...props}
      />
      {error ? <STText className="text-danger text-xs mt-1" style={{ color: '#EF4444' }}>{error}</STText> : null}
    </View>
  );
}
