import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import useThemeStore from '@/store/themeStore';
import LiveGlass from '@/components/theme/LiveGlass';
import { CARD_PADDING } from './metrics';

/** Caller style keys that position the card in its parent. They belong outside the hit area. */
const LAYOUT_KEYS = new Set([
  'margin',
  'marginTop',
  'marginRight',
  'marginBottom',
  'marginLeft',
  'marginHorizontal',
  'marginVertical',
  'marginStart',
  'marginEnd',
  'flex',
  'flexGrow',
  'flexShrink',
  'flexBasis',
  'alignSelf',
  'width',
  'minWidth',
  'maxWidth',
  'position',
  'top',
  'right',
  'bottom',
  'left',
  'zIndex',
]);

function splitStyle(style) {
  const flat = StyleSheet.flatten(style) || {};
  const layout = {};
  const rest = {};
  Object.entries(flat).forEach(([key, value]) => {
    if (LAYOUT_KEYS.has(key)) layout[key] = value;
    else rest[key] = value;
  });
  return { layout, rest };
}

/**
 * Stage card. In Live Dark it goes through LiveGlass so the wallpaper shows through.
 * `solid` opts out of that for surfaces that must stay readable over anything (dialogs):
 * Live Dark then paints opaque `bgDeep` instead of the translucent glass.
 */
export default function Card({
  children,
  highlight = false,
  solid = false,
  style,
  onPress,
  testID,
  accessibilityLabel,
  accessibilityHint,
}) {
  const tokens = useThemeStore((s) => s.tokens);
  const live = tokens.live === true;

  const surface = {
    borderRadius: tokens.cardRadius,
    borderWidth: 1,
    borderColor: highlight ? tokens.aqua : tokens.border,
    padding: CARD_PADDING,
  };

  // Pressable cards: layout on the Pressable, visuals on the card inside it.
  const { layout, rest } = onPress ? splitStyle(style) : { layout: null, rest: style };
  const stretch = layout && (layout.flex != null || layout.flexGrow != null);
  const cardStyle = [rest, stretch ? { flexGrow: 1 } : null];

  // One glass surface, shared by the plain and the testID-wrapped Live branches.
  const renderGlass = (glassStyle) => (
    <LiveGlass style={[surface, glassStyle]}>
      {highlight ? (
        <View
          testID="card-highlight"
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, { backgroundColor: tokens.cardHi }]}
        />
      ) : null}
      {children}
    </LiveGlass>
  );

  let card;
  if (live && !solid) {
    if (!onPress && testID) {
      // LiveGlass takes no testID; carry it on a wrapper that holds the caller's layout.
      const { layout: outer, rest: inner } = splitStyle(style);
      card = (
        <View testID={testID} style={outer}>
          {renderGlass(inner)}
        </View>
      );
    } else {
      card = renderGlass(cardStyle);
    }
  } else {
    card = (
      <View
        testID={onPress ? undefined : testID}
        style={[surface, { backgroundColor: solid && live ? tokens.bgDeep : highlight ? tokens.cardHi : tokens.card }, cardStyle]}
      >
        {children}
      </View>
    );
  }

  if (!onPress) return card;
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      onPress={onPress}
      style={({ pressed }) => [layout, { opacity: pressed ? 0.85 : 1 }]}
    >
      {card}
    </Pressable>
  );
}
