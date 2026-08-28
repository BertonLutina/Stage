import React from 'react';
import { Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { headingStyleSm } from '@/lib/fonts';
import { SILVER } from '@/components/transfer/transferHubTheme';

export default function HubToggle({ label, icon, active, badge, onPress }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        minHeight: 36,
        paddingHorizontal: 12,
        borderWidth: 1,
        borderColor: active ? 'rgba(248,251,255,0.55)' : 'rgba(255,255,255,0.12)',
        backgroundColor: active ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.35)',
      }}
    >
      <Ionicons name={icon} size={14} color={active ? SILVER : 'rgba(255,255,255,0.5)'} />
      <Text style={[headingStyleSm, { fontSize: 11, letterSpacing: 1.6, color: active ? SILVER : 'rgba(255,255,255,0.5)' }]}>
        {label}
      </Text>
      {badge > 0 ? (
        <Text style={{ color: active ? SILVER : 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: '800' }}>
          {badge}
        </Text>
      ) : null}
    </TouchableOpacity>
  );
}
