import React from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import STText from './STText';
import useThemeStore from '../../store/themeStore';

export default function Input({ label, error, className = '', onTogglePassword,color, secureTextEntry, ...props  }) {
  const isDark = useThemeStore((s) => s.resolvedTheme) === 'dark';
  const showPasswordToggle = onTogglePassword != null;

  return (
    <View className={`mb-4 ${className}`}>
      {label ? (
        <STText color={color} className="text-sm font-semibold mb-1 dark:text-white text-gray-100">
          {label}
        </STText>
      ) : null}
      <View style={styles.inputWrapper}>
        <TextInput
          className={`dark:bg-card bg-white/20 border rounded-xl px-4 py-3 text-base ${
            error ? 'border-danger' : 'border-white/40'
          } dark:text-white text-gray-900`}
          style={showPasswordToggle ? { paddingRight: 44 } : undefined}
          placeholderTextColor={isDark ? 'white' : 'black'}
          secureTextEntry={secureTextEntry}
          {...props}
        />
        {showPasswordToggle && (
          <TouchableOpacity
            onPress={onTogglePassword}
            style={styles.eyeButton}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons
              name={secureTextEntry ? 'eye-outline' : 'eye-off-outline'}
              size={22}
              color="rgba(255,255,255,0.6)"
            />
          </TouchableOpacity>
        )}
      </View>
      {error ? <STText className="text-danger text-xs mt-1" style={{ color: '#EF4444' }}>{error}</STText> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  inputWrapper: {
    position: 'relative',
  },
  eyeButton: {
    position: 'absolute',
    right: 12,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
});
