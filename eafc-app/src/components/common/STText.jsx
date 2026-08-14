import React from 'react';
import { Text } from 'react-native';
import useThemeStore from '../../store/themeStore';

/**
 * Theme-aware Text. Dark surfaces get paper white; light surfaces get marine ink.
 * Passes through all Text props. Use style or className to override color.
 */
export default function STText({ color = null, style, ...props }) {
  const tokens = useThemeStore((s) => s.tokens);
  const themeColor = color || tokens.text;
  return (
    <Text
      style={[{ color: themeColor }, style]}
      {...props}
    />
  );
}
