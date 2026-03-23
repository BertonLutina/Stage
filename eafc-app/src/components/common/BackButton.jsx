import React from 'react';
import { TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import useColorSchemeColors from '../../hooks/useColorSchemeColors';

/**
 * Standard back button: h-10 w-10 rounded-full, left-aligned.
 * Used in screen headers for consistent layout.
 *
 * @param {Object} props
 * @param {Function} [props.onPress] - Custom onPress (default: router.back())
 * @param {'default'|'light'} [props.variant='default'] - 'light' for dark backgrounds (GradientBackground, etc.)
 */
export default function BackButton({ onPress, variant = 'default' }) {
  const router = useRouter();
  const { isDark } = useColorSchemeColors();

  const handlePress = onPress || (() => router.back());

  if (variant === 'light') {
    return (
      <TouchableOpacity
        onPress={handlePress}
        className="h-10 w-10 rounded-full border border-white/20 items-center justify-center"
        style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
      >
        <Ionicons name="arrow-back" size={20} color="#fff" />
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={handlePress}
      className="h-10 w-10  rounded-full border items-center justify-center"
      style={{
        borderColor: isDark ? 'rgba(199,216,243,0.2)' : '#C9D8F2',
        backgroundColor: isDark ? 'rgba(255,255,255,0.2)' : '#FFFFFF',
      }}
    >
      <Ionicons name="arrow-back" size={20} color={isDark ? '#FFFFFF' : '#1B2D4A'} />
    </TouchableOpacity>
  );
}
