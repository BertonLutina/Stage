import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import LiveGlass from '@/components/theme/LiveGlass';
import { useGamerTokens } from '@/components/profile/gamer/GamerProfileUI';
import { headingStyleSm } from '@/lib/fonts';
import { CARD_RADIUS } from '@/lib/stageTheme';

export default function SettingsSection({ title, description, icon, children, action }) {
  const tokens = useGamerTokens();
  return (
    <LiveGlass
      intensity={36}
      style={{
        borderRadius: CARD_RADIUS,
        borderWidth: 1,
        borderColor: tokens.hairline,
        backgroundColor: tokens.live ? 'transparent' : tokens.card,
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 12,
          paddingHorizontal: 14,
          paddingVertical: 12,
          borderBottomWidth: 1,
          borderBottomColor: tokens.hairline,
          backgroundColor: 'transparent',
          overflow: 'hidden',
          borderTopLeftRadius: CARD_RADIUS,
          borderTopRightRadius: CARD_RADIUS,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10, flex: 1 }}>
          {icon ? (
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                backgroundColor: tokens.tileFill,
                borderWidth: 1,
                borderColor: tokens.cyanBorder,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name={icon} size={16} color={tokens.cyan} />
            </View>
          ) : null}
          <View style={{ flex: 1 }}>
            <Text style={[headingStyleSm, { color: tokens.text, fontSize: 12 }]}>{title}</Text>
            {description ? (
              <Text style={{ color: tokens.muted, fontSize: 12, marginTop: 3, lineHeight: 16 }}>
                {description}
              </Text>
            ) : null}
          </View>
        </View>
        {action}
      </View>
      <View style={{ padding: 14 }}>{children}</View>
    </LiveGlass>
  );
}
