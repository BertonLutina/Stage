import React from 'react';
import { Text } from 'react-native';
import useColorSchemeColors from '../../hooks/useColorSchemeColors';

/**
 * Theme-aware Text. Uses #02091B in light mode, #FFFFFF in dark mode.
 * Passes through all Text props. Use style or className to override color.
 */
export default function STText({ style, ...props }) {
  const { isDark } = useColorSchemeColors();
  const themeColor = isDark ? '#FFFFFF' : '#02091B';
  return (
    <Text
      style={[{ color: themeColor }, style]}
      {...props}
    />
  );
}
