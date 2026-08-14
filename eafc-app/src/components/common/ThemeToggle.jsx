import React from 'react';
import { TouchableOpacity, View } from 'react-native';
import STText from './STText';
import useThemeStore from '../../store/themeStore';

export default function ThemeToggle({ style }) {
  const liveDark = useThemeStore((s) => s.liveDark);
  const toggleTheme = useThemeStore((s) => s.toggleTheme);

  return (
    <TouchableOpacity
      onPress={toggleTheme}
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: '#1A3566',
          borderRadius: 20,
          paddingHorizontal: 12,
          paddingVertical: 6,
          gap: 6,
        },
        style,
      ]}
      activeOpacity={0.8}
    >
      <STText style={{ fontSize: 12, fontWeight: '800', letterSpacing: 1 }}>
        {liveDark ? 'LIVE' : 'DARK'}
      </STText>
      <View
        style={{
          width: 36,
          height: 20,
          borderRadius: 10,
          backgroundColor: liveDark ? '#5FE3E8' : '#6B7280',
          justifyContent: 'center',
          paddingHorizontal: 2,
        }}
      >
        <View
          style={{
            width: 16,
            height: 16,
            borderRadius: 8,
            backgroundColor: '#fff',
            alignSelf: liveDark ? 'flex-end' : 'flex-start',
          }}
        />
      </View>
    </TouchableOpacity>
  );
}
