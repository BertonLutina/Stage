import React from 'react';
import { View, Text, Image } from 'react-native';
import useThemeStore from '@/store/themeStore';
import { FONT_EA_SPORTS } from '@/lib/fonts';
import { AVATAR_SIZE, AVATAR_RADIUS } from './metrics';

/** Initials tile (radius 12) or round crest (`round`). */
export default function Avatar({ initials, uri, size = AVATAR_SIZE, round = false, testID }) {
  const tokens = useThemeStore((s) => s.tokens);
  const radius = round ? size / 2 : AVATAR_RADIUS;

  return (
    <View
      testID={testID}
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        backgroundColor: tokens.border,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      {uri ? (
        <Image source={{ uri }} style={{ width: size, height: size }} resizeMode="cover" />
      ) : (
        <Text
          numberOfLines={1}
          style={{
            color: tokens.cyanHi,
            fontFamily: FONT_EA_SPORTS,
            fontSize: Math.round(size * 0.36),
            textTransform: 'uppercase',
            letterSpacing: 0.5,
          }}
        >
          {initials}
        </Text>
      )}
    </View>
  );
}
