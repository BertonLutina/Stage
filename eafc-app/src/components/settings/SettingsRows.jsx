import React from 'react';
import { View, Text } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import useThemeStore from '@/store/themeStore';
import { Card, ListRow } from '@/components/ui';
import { ICON_SIZE, MIN_TOUCH } from '@/components/ui/metrics';

/**
 * Card of rows with hairline dividers between them (Settings mockup: padding 0, rows 16px
 * from the edge). Falsy children are skipped so conditional rows leave no stray divider.
 */
export function SettingsGroup({ children }) {
  const tokens = useThemeStore((s) => s.tokens);
  const rows = React.Children.toArray(children).filter(Boolean);
  return (
    <Card style={{ padding: 0 }}>
      {rows.map((row, index) => (
        <View
          key={row.key ?? index}
          style={{
            paddingHorizontal: 16,
            borderTopWidth: index === 0 ? 0 : 1,
            borderTopColor: tokens.border,
          }}
        >
          {row}
        </View>
      ))}
    </Card>
  );
}

/**
 * One settings row. A plain tappable row is a `ListRow`; a row with a description and/or a
 * trailing control (`right`, e.g. a Toggle) gets the same metrics laid out here because
 * ListRow has no slot for either.
 */
export function SettingsRow({
  icon,
  title,
  subtitle,
  value,
  onPress,
  right,
  danger = false,
  chevron = true,
}) {
  const tokens = useThemeStore((s) => s.tokens);

  if (!right && !subtitle) {
    return (
      <ListRow
        icon={icon}
        title={title}
        value={value}
        onPress={onPress}
        chevron={chevron}
        danger={danger}
      />
    );
  }

  return (
    <View
      style={{
        minHeight: MIN_TOUCH + 8,
        paddingVertical: 8,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
      }}
    >
      {icon ? (
        <Ionicons name={icon} size={ICON_SIZE} color={danger ? tokens.danger : tokens.textSoft} />
      ) : null}
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text
          numberOfLines={2}
          style={{ color: danger ? tokens.danger : tokens.text, fontSize: 15, fontWeight: '600' }}
        >
          {title}
        </Text>
        {subtitle ? (
          <Text numberOfLines={3} style={{ color: tokens.muted, fontSize: 12, lineHeight: 16, marginTop: 2 }}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {value != null && value !== '' ? (
        <Text numberOfLines={1} style={{ flexShrink: 1, maxWidth: '40%', color: tokens.muted, fontSize: 14 }}>
          {value}
        </Text>
      ) : null}
      {right || null}
    </View>
  );
}

/** Group heading inside a card, same type as the screen's section labels but one step quieter. */
export function SettingsGroupLabel({ children }) {
  const tokens = useThemeStore((s) => s.tokens);
  return (
    <Text
      numberOfLines={1}
      style={{
        color: tokens.muted,
        fontSize: 11,
        fontWeight: '600',
        letterSpacing: 11 * 0.12,
        textTransform: 'uppercase',
      }}
    >
      {children}
    </Text>
  );
}
