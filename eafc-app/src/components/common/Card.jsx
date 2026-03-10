import React from 'react';
import { View } from 'react-native';

export default function Card({ children, className = '' }) {
  return (
    <View className={`bg-card rounded-2xl p-4 border border-border ${className}`}>
      {children}
    </View>
  );
}
