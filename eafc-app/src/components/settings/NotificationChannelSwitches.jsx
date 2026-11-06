import React from 'react';
import { View, Text } from 'react-native';
import useThemeStore from '@/store/themeStore';
import { Toggle } from '@/components/ui';
import { MIN_TOUCH } from '@/components/ui/metrics';
import {
  NOTIFICATION_SETTINGS,
  NOTIFICATION_SETTING_GROUPS,
  isChannelCategoryOn,
} from '@/lib/notificationTypes';
import { SettingsGroupLabel } from './SettingsRows';

export default function NotificationChannelSwitches({ settings, channel, onToggle }) {
  const tokens = useThemeStore((s) => s.tokens);
  const settingsByKey = Object.fromEntries(NOTIFICATION_SETTINGS.map((row) => [row.key, row]));

  return (
    <View style={{ gap: 14 }}>
      {NOTIFICATION_SETTING_GROUPS.map((group) => (
        <View key={`${channel}-${group.label}`} style={{ gap: 2 }}>
          <SettingsGroupLabel>{group.label}</SettingsGroupLabel>
          {group.keys.map((key, index) => {
            const row = settingsByKey[key];
            if (!row) return null;
            return (
              <View
                key={key}
                style={{
                  minHeight: MIN_TOUCH + 4,
                  paddingVertical: 8,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  borderTopWidth: index === 0 ? 0 : 1,
                  borderTopColor: tokens.border,
                }}
              >
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text numberOfLines={2} style={{ color: tokens.text, fontWeight: '600', fontSize: 15 }}>
                    {row.label}
                  </Text>
                  <Text numberOfLines={3} style={{ color: tokens.muted, fontSize: 12, lineHeight: 16, marginTop: 2 }}>
                    {row.description}
                  </Text>
                </View>
                <Toggle
                  value={isChannelCategoryOn(settings, channel, key)}
                  onValueChange={(next) => onToggle(channel, key, next)}
                  accessibilityLabel={`${row.label}, ${channel}`}
                />
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
}
