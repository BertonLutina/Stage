import React from 'react';
import { View, Text, Switch } from 'react-native';
import { useGamerTokens, CYAN } from '@/components/profile/gamer/GamerProfileUI';
import {
  NOTIFICATION_SETTINGS,
  NOTIFICATION_SETTING_GROUPS,
  isChannelCategoryOn,
} from '@/lib/notificationTypes';

export default function NotificationChannelSwitches({ settings, channel, onToggle }) {
  const tokens = useGamerTokens();
  const settingsByKey = Object.fromEntries(NOTIFICATION_SETTINGS.map((row) => [row.key, row]));

  return (
    <View>
      {NOTIFICATION_SETTING_GROUPS.map((group) => (
        <View key={`${channel}-${group.label}`} style={{ marginBottom: 10 }}>
          <Text style={{ color: tokens.muted, fontSize: 10, fontWeight: '800', letterSpacing: 1.4, marginBottom: 6 }}>
            {group.label.toUpperCase()}
          </Text>
          {group.keys.map((key) => {
            const row = settingsByKey[key];
            if (!row) return null;
            return (
              <View key={key} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8 }}>
                <View style={{ flex: 1, paddingRight: 12 }}>
                  <Text style={{ color: tokens.text, fontWeight: '700', fontSize: 13 }}>{row.label}</Text>
                  <Text style={{ color: tokens.muted, fontSize: 11, marginTop: 2 }}>{row.description}</Text>
                </View>
                <Switch
                  value={isChannelCategoryOn(settings, channel, key)}
                  onValueChange={(next) => onToggle(channel, key, next)}
                  trackColor={{ false: 'rgba(255,255,255,0.15)', true: CYAN }}
                  thumbColor="#fff"
                />
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
}
