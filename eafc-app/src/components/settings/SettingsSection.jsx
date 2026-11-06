import React from 'react';
import { View, Text } from 'react-native';
import useThemeStore from '@/store/themeStore';
import { Card, SectionLabel } from '@/components/ui';
import { SettingsGroup } from './SettingsRows';

/**
 * Section label above a Stage card. `description` is a muted line at the top of the card;
 * `action` sits at the right end of the label. With `rows`, the children are SettingsRow
 * elements laid out as a divided group (mockup: padding 0) and `description` sits above it.
 * `icon` is accepted for call-site compatibility:
 * the mockup's section labels carry no icon.
 */
// eslint-disable-next-line no-unused-vars
export default function SettingsSection({
  title, description, icon, children, action, rows = false,
}) {
  const tokens = useThemeStore((s) => s.tokens);
  if (rows) {
    return (
      <View style={{ gap: 10 }}>
        <SectionLabel right={action}>{title}</SectionLabel>
        {description ? (
          <Text style={{ color: tokens.muted, fontSize: 13, lineHeight: 18 }}>{description}</Text>
        ) : null}
        <SettingsGroup>{children}</SettingsGroup>
      </View>
    );
  }
  return (
    <View style={{ gap: 10 }}>
      <SectionLabel right={action}>{title}</SectionLabel>
      <Card style={{ gap: 12 }}>
        {description ? (
          <Text style={{ color: tokens.muted, fontSize: 13, lineHeight: 18 }}>{description}</Text>
        ) : null}
        {children}
      </Card>
    </View>
  );
}
