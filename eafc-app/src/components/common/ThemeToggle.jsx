import React from 'react';
import { TouchableOpacity, View } from 'react-native';
import STText from './STText';
import useThemeStore from '../../store/themeStore';

export default function ThemeToggle({ style }) {
  const { resolvedTheme, toggleTheme } = useThemeStore();
  const isDark = resolvedTheme === 'dark';

  return (
    <TouchableOpacity
      onPress={toggleTheme}
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: isDark ? '#1A3566' : '#E5E7EB',
          borderRadius: 20,
          paddingHorizontal: 12,
          paddingVertical: 6,
          gap: 6,
        },
        style,
      ]}
      activeOpacity={0.8}
    >
      <STText style={{ fontSize: 16 }}>{isDark ? '🌙' : '☀️'}</STText>
      <View
        style={{
          width: 36,
          height: 20,
          borderRadius: 10,
          backgroundColor: isDark ? '#5FE3E8' : '#6B7280',
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
            alignSelf: isDark ? 'flex-end' : 'flex-start',
          }}
        />
      </View>
      <STText style={{ fontSize: 16 }}>{isDark ? '' : '🌤️'}</STText>
    </TouchableOpacity>
  );
}
