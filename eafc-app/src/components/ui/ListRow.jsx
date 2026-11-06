import React from 'react';
import { View, Text, Pressable } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import useThemeStore from '@/store/themeStore';
import { ICON_SIZE, MIN_TOUCH } from './metrics';

export default function ListRow({ icon, title, value, onPress, chevron = true, danger = false }) {
  const tokens = useThemeStore((s) => s.tokens);
  const fg = danger ? tokens.danger : tokens.text;

  const content = (
    <>
      {icon ? <Ionicons name={icon} size={ICON_SIZE} color={danger ? tokens.danger : tokens.textSoft} /> : null}
      <Text
        numberOfLines={1}
        ellipsizeMode="tail"
        style={{ flex: 1, color: fg, fontSize: 15, fontWeight: '600' }}
      >
        {title}
      </Text>
      {value != null && value !== '' ? (
        <Text
          numberOfLines={1}
          ellipsizeMode="tail"
          style={{ flexShrink: 1, maxWidth: '45%', color: tokens.muted, fontSize: 14 }}
        >
          {value}
        </Text>
      ) : null}
      {onPress && chevron ? (
        <Ionicons name="chevron-forward" size={18} color={tokens.muted} />
      ) : null}
    </>
  );

  const rowStyle = {
    minHeight: MIN_TOUCH + 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  };

  if (!onPress) return <View style={rowStyle}>{content}</View>;
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={rowStyle}>
      {content}
    </Pressable>
  );
}
