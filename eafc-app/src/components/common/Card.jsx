import React from 'react';
import { View } from 'react-native';
import { CARD_RADIUS } from '@/lib/stageTheme';

export default function Card({ children, className = '' }) {
  return (
    <View
      className={`bg-card p-4 border border-border ${className}`}
      style={{ borderRadius: CARD_RADIUS }}
    >
      {children}
    </View>
  );
}
