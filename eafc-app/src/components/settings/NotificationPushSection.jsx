import React from 'react';
import { View, Text, Switch, TouchableOpacity, Linking } from 'react-native';
import { useGamerTokens } from '@/components/profile/gamer/GamerProfileUI';
import SettingsSection from '@/components/settings/SettingsSection';

function PushToggleBody({ status, busy, onToggle }) {
  const tokens = useGamerTokens();
  const configured = Boolean(status?.configured);
  const permission = Boolean(status?.permission);
  const optedIn = Boolean(status?.optedIn);
  const phoneOn = configured && permission && optedIn;

  if (!configured) {
    return (
      <Text style={{ color: tokens.muted, fontSize: 13, lineHeight: 18 }}>
        Push is not configured on this build. In-app alerts still follow the category switches below.
      </Text>
    );
  }

  return (
    <>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <View style={{ flex: 1, paddingRight: 8 }}>
          <Text style={{ color: tokens.text, fontWeight: '700' }}>Lock screen & banners</Text>
          <Text style={{ color: tokens.muted, fontSize: 12, marginTop: 3, lineHeight: 16 }}>
            {permission
              ? (optedIn ? 'Phone push is on.' : 'Permission granted, push is opted out.')
              : 'STAGE does not have notification permission on this phone.'}
          </Text>
        </View>
        <Switch
          value={phoneOn}
          disabled={busy}
          onValueChange={onToggle}
          trackColor={{ false: tokens.hairline, true: tokens.cyan }}
          thumbColor={tokens.isDark ? '#fff' : '#F4F7FB'}
        />
      </View>
      {!permission ? (
        <TouchableOpacity
          onPress={() => Linking.openSettings()}
          accessibilityRole="button"
          accessibilityLabel="Open phone notification settings"
          style={{
            marginTop: 12,
            minHeight: 44,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: tokens.cyanBorder,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ color: tokens.cyan, fontWeight: '800' }}>Open phone settings</Text>
        </TouchableOpacity>
      ) : null}
    </>
  );
}

export default function NotificationPushSection({ status, busy, onToggle, embedded = false }) {
  if (embedded) {
    return <PushToggleBody status={status} busy={busy} onToggle={onToggle} />;
  }

  return (
    <SettingsSection
      title="Phone notifications"
      description="Banners and lock screen use your phone’s notification sound. Change that tone in iPhone or Android settings — STAGE does not play its own sounds."
      icon="phone-portrait-outline"
    >
      <PushToggleBody status={status} busy={busy} onToggle={onToggle} />
    </SettingsSection>
  );
}
