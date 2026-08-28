import React from 'react';
import { TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function GameDayTileMenuButton({ onPress, accessibilityLabel = 'Change background' }) {
  if (!onPress) return null;
  return (
    <TouchableOpacity
      onPress={onPress}
      accessibilityLabel={accessibilityLabel}
      hitSlop={10}
      style={{
        width: 32,
        height: 32,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.15)',
        backgroundColor: 'rgba(0,0,0,0.35)',
      }}
    >
      <Ionicons name="ellipsis-horizontal" size={16} color="rgba(255,255,255,0.7)" />
    </TouchableOpacity>
  );
}
