import React from 'react';
import { Pressable, Text, View } from 'react-native';
import useThemeStore from '@/store/themeStore';
import { Avatar } from '@/components/ui';
import { CHIP_HEIGHT, CHIP_RADIUS } from '@/components/ui/metrics';

/**
 * Search-result row (Search mockup): avatar, name + meta, and a pill action on the right.
 * The row body and the action are separate buttons so each is reachable by screen readers.
 */
export default function DirectoryResultRow({
  imageUrl,
  initials,
  round = false,
  name,
  meta,
  actionLabel,
  actionPrimary = false,
  onPress,
  onAction,
}) {
  const tokens = useThemeStore((s) => s.tokens);
  const fg = actionPrimary ? tokens.onCyan : tokens.cyan;

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: tokens.border,
      }}
    >
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={meta ? `${name}, ${meta}` : name}
        style={({ pressed }) => ({
          flex: 1,
          minWidth: 0,
          minHeight: 44,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          opacity: pressed ? 0.85 : 1,
        })}
      >
        <Avatar uri={imageUrl} initials={initials} round={round} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text numberOfLines={1} style={{ color: tokens.text, fontSize: 15, fontWeight: '700' }}>
            {name}
          </Text>
          <Text numberOfLines={1} style={{ color: tokens.muted, fontSize: 12, marginTop: 2 }}>
            {meta}
          </Text>
        </View>
      </Pressable>
      <Pressable
        onPress={onAction}
        accessibilityRole="button"
        accessibilityLabel={`${actionLabel} ${name}`}
        hitSlop={{ top: 5, bottom: 5 }}
        style={({ pressed }) => ({
          height: CHIP_HEIGHT,
          justifyContent: 'center',
          paddingHorizontal: 14,
          borderRadius: CHIP_RADIUS,
          borderWidth: 1,
          borderColor: tokens.cyan,
          backgroundColor: actionPrimary ? tokens.cyan : 'transparent',
          opacity: pressed ? 0.85 : 1,
        })}
      >
        <Text numberOfLines={1} style={{ color: fg, fontSize: 13, fontWeight: '600' }}>
          {actionLabel}
        </Text>
      </Pressable>
    </View>
  );
}
