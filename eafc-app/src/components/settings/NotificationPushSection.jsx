import React from 'react';
import { View, Text, Linking } from 'react-native';
import useThemeStore from '@/store/themeStore';
import { Button, Toggle } from '@/components/ui';
import { SettingsRow } from '@/components/settings/SettingsRows';
import SettingsSection from '@/components/settings/SettingsSection';

function PushToggleBody({ status, busy, onToggle }) {
  const tokens = useThemeStore((s) => s.tokens);
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
    <View style={{ gap: 12 }}>
      <SettingsRow
        title="Lock screen & banners"
        subtitle={permission
          ? (optedIn ? 'Phone push is on.' : 'Permission granted, push is opted out.')
          : 'STAGE does not have notification permission on this phone.'}
        right={(
          <Toggle
            value={phoneOn}
            disabled={Boolean(busy)}
            onValueChange={onToggle}
            accessibilityLabel="Lock screen & banners"
          />
        )}
      />
      {!permission ? (
        <Button
          title="Open phone settings"
          variant="secondary"
          accessibilityLabel="Open phone notification settings"
          onPress={() => Linking.openSettings()}
        />
      ) : null}
    </View>
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
