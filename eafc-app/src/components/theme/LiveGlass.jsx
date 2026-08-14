import React from 'react';
import { View, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import useThemeStore from '@/store/themeStore';

const RADIUS_KEYS = [
  'borderRadius',
  'borderTopLeftRadius',
  'borderTopRightRadius',
  'borderBottomLeftRadius',
  'borderBottomRightRadius',
];

const OUTER_ONLY_KEYS = new Set([
  ...RADIUS_KEYS,
  'width',
  'height',
  'minWidth',
  'minHeight',
  'maxWidth',
  'maxHeight',
  'flex',
  'flexGrow',
  'flexShrink',
  'flexBasis',
  'alignSelf',
  'aspectRatio',
  'margin',
  'marginTop',
  'marginRight',
  'marginBottom',
  'marginLeft',
  'marginHorizontal',
  'marginVertical',
  'marginStart',
  'marginEnd',
  'shadowColor',
  'shadowOpacity',
  'shadowRadius',
  'shadowOffset',
  'elevation',
  'position',
  'top',
  'right',
  'bottom',
  'left',
  'zIndex',
]);

function pickRadius(flat) {
  const radius = {};
  RADIUS_KEYS.forEach((key) => {
    if (flat[key] != null) radius[key] = flat[key];
  });
  return radius;
}

/** Shadow/size on the outer shell; chrome and children clip to the rounded border. */
export function splitLiveGlassStyle(style) {
  const flat = StyleSheet.flatten(style) || {};
  const outer = {};
  const inner = {};

  Object.entries(flat).forEach(([key, value]) => {
    if (OUTER_ONLY_KEYS.has(key)) outer[key] = value;
    else inner[key] = value;
  });

  Object.assign(inner, pickRadius(flat), { overflow: 'hidden' });
  if (typeof flat.minHeight === 'number') inner.minHeight = flat.minHeight;
  if (typeof flat.minWidth === 'number') inner.minWidth = flat.minWidth;

  const fillInner = outer.flex != null || outer.flexGrow != null || outer.height != null;
  return { outer, inner, fillInner };
}

/** Frosted HUD pane. Content is clipped to the card radius so headers never spill past the border. */
export default function LiveGlass({ children, style, intensity = 36 }) {
  const tokens = useThemeStore((s) => s.tokens);
  const { outer, inner, fillInner } = splitLiveGlassStyle(style);
  const radius = pickRadius(inner);

  return (
    <View style={outer}>
      <View testID="live-glass-clip" style={[inner, fillInner ? styles.fill : null]}>
        {tokens.live ? (
          <>
            <BlurView
              intensity={intensity}
              tint="dark"
              experimentalBlurMethod="dimezisBlurView"
              style={[StyleSheet.absoluteFill, radius, styles.clip]}
            />
            <View
              pointerEvents="none"
              style={[StyleSheet.absoluteFill, radius, styles.clip, { backgroundColor: tokens.card }]}
            />
          </>
        ) : null}
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  clip: {
    overflow: 'hidden',
  },
  fill: {
    flexGrow: 1,
    alignSelf: 'stretch',
  },
});
