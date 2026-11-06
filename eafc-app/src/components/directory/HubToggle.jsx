import React from 'react';
import { Pressable, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import useThemeStore from '@/store/themeStore';
import { CHIP_HEIGHT, CHIP_RADIUS } from '@/components/ui/metrics';

/** Stage chip (34 high, pill) with an icon and an optional trailing count. */
export default function HubToggle({ label, icon, active, badge, onPress }) {
  const tokens = useThemeStore((s) => s.tokens);
  const fg = active ? tokens.onCyan : tokens.textSoft;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: Boolean(active) }}
      hitSlop={{ top: 5, bottom: 5 }}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        height: CHIP_HEIGHT,
        paddingHorizontal: 14,
        borderRadius: CHIP_RADIUS,
        borderWidth: 1,
        borderColor: active ? tokens.cyan : tokens.border,
        backgroundColor: active ? tokens.cyan : tokens.card,
        opacity: pressed ? 0.85 : 1,
      })}
    >
      {icon ? <Ionicons name={icon} size={16} color={fg} /> : null}
      <Text numberOfLines={1} style={{ color: fg, fontSize: 13, fontWeight: '600', flexShrink: 1 }}>
        {label}
      </Text>
      {badge > 0 ? (
        <Text style={{ color: fg, fontSize: 12, fontWeight: '600', opacity: 0.8 }}>
          {badge}
        </Text>
      ) : null}
    </Pressable>
  );
}
