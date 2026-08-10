import React from 'react';
import { Text } from 'react-native';
import { headingStyle } from '@/lib/fonts';

/**
 * Stage display heading — EA Sports 15, default 20px.
 */
export default function Heading({ style, children, size = 20, ...props }) {
  return (
    <Text
      {...props}
      style={[
        headingStyle,
        size !== 20 ? { fontSize: size } : null,
        style,
      ]}
    >
      {children}
    </Text>
  );
}
