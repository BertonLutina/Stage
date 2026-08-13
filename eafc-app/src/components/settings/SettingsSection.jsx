import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CYAN } from '@/components/profile/gamer/GamerProfileUI';
import { headingStyleSm } from '@/lib/fonts';

export default function SettingsSection({ title, description, icon, children, action }) {
  return (
    <View
      style={{
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.10)',
        backgroundColor: 'rgba(255,255,255,0.03)',
        overflow: 'hidden',
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
          borderBottomColor: 'rgba(255,255,255,0.08)',
          backgroundColor: 'rgba(0,240,255,0.05)',
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10, flex: 1 }}>
          {icon ? (
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                backgroundColor: 'rgba(0,240,255,0.10)',
                borderWidth: 1,
                borderColor: 'rgba(0,240,255,0.20)',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name={icon} size={16} color={CYAN} />
            </View>
          ) : null}
          <View style={{ flex: 1 }}>
            <Text style={[headingStyleSm, { color: 'rgba(255,255,255,0.92)', fontSize: 12 }]}>{title}</Text>
            {description ? (
              <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12, marginTop: 3, lineHeight: 16 }}>
                {description}
              </Text>
            ) : null}
          </View>
        </View>
        {action}
      </View>
      <View style={{ padding: 14 }}>{children}</View>
    </View>
  );
}
