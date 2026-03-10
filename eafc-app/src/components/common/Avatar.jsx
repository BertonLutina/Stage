import React from 'react';
import { View, Image, Text } from 'react-native';

export default function Avatar({ uri, name = '', size = 48, className = '' }) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const style = { width: size, height: size, borderRadius: size / 2 };

  if (uri) {
    return <Image source={{ uri }} style={style} className={`bg-surface ${className}`} />;
  }
  return (
    <View style={style} className={`bg-surface border border-border items-center justify-center ${className}`}>
      <Text style={{ fontSize: size * 0.35 }} className="text-primary font-bold">
        {initials || '?'}
      </Text>
    </View>
  );
}
