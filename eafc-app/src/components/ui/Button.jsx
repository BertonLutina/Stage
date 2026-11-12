import React, { useState } from 'react';
import { Pressable, Text, View, ActivityIndicator, StyleSheet, Dimensions, Platform } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import Svg, { Polygon } from 'react-native-svg';
import useThemeStore from '@/store/themeStore';
import { BUTTON_HEIGHT, BUTTON_RADIUS, BUTTON_CUT, ICON_SIZE, SCREEN_GUTTER } from './metrics';

/**
 * Mockup Welcome CTAs:
 * - primary `.btn`: #5FE3E8, #07163A, uppercase 800, 12px TL/BR cuts
 * - secondary `.btn2`: transparent, #5FE3E8 border, radius 14, sentence case 600
 *
 * Vertical centering: label uses height + lineHeight = 52 with textAlignVertical
 * (Android) and a 1px iOS optical nudge — flex alone leaves uppercase glyphs high.
 */

const CTA = '#5FE3E8';
const CTA_PRESSED = '#8CF5F8';
const CTA_INK = '#07163A';
const LABEL_SIZE = 15;

function cutPoints(width, height, cut) {
  return [
    `${cut},0`,
    `${width},0`,
    `${width},${height - cut}`,
    `${width - cut},${height}`,
    `0,${height}`,
    `0,${cut}`,
  ].join(' ');
}

function estimateWidth() {
  return Math.max(200, Dimensions.get('window').width - SCREEN_GUTTER * 2);
}

function CutFill({ width, color, cut = BUTTON_CUT }) {
  const w = width > 0 ? width : estimateWidth();
  const h = BUTTON_HEIGHT;
  return (
    <Svg width={w} height={h} style={StyleSheet.absoluteFill} pointerEvents="none">
      <Polygon points={cutPoints(w, h, cut)} fill={color} />
    </Svg>
  );
}

function colorsFor(tokens, variant, pressed) {
  if (variant === 'secondary') {
    return { bg: 'transparent', border: CTA, fg: CTA, cut: false };
  }
  if (variant === 'danger') {
    return { bg: 'transparent', border: tokens.danger, fg: tokens.danger, cut: false };
  }
  return {
    bg: pressed ? CTA_PRESSED : CTA,
    border: 'transparent',
    fg: CTA_INK,
    cut: true,
  };
}

function Label({ title, color, cut, icon }) {
  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        height: BUTTON_HEIGHT,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 16,
        gap: 8,
      }}
    >
      {icon ? <Ionicons name={icon} size={ICON_SIZE} color={color} /> : null}
      <Text
        numberOfLines={1}
        ellipsizeMode="tail"
        style={{
          color,
          fontSize: LABEL_SIZE,
          // Full-bar line box + center → true vertical middle on both platforms.
          height: BUTTON_HEIGHT,
          lineHeight: BUTTON_HEIGHT,
          fontWeight: cut ? '800' : '600',
          letterSpacing: cut ? 0.9 : 0,
          textTransform: cut ? 'uppercase' : 'none',
          textAlign: 'center',
          textAlignVertical: 'center',
          includeFontPadding: false,
          // iOS uppercase sits optically high inside the line box.
          ...(Platform.OS === 'ios' ? { transform: [{ translateY: 1 }] } : null),
        }}
      >
        {title}
      </Text>
    </View>
  );
}

export default function Button({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  icon,
  accessibilityLabel,
  testID,
}) {
  const tokens = useThemeStore((s) => s.tokens);
  const inert = disabled || loading;
  const [pressed, setPressed] = useState(false);
  const [width, setWidth] = useState(0);
  const c = colorsFor(tokens, variant, pressed);

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || title}
      accessibilityState={{ disabled: inert, busy: loading }}
      disabled={inert}
      onPress={inert ? undefined : onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      onLayout={(e) => {
        const next = e.nativeEvent.layout.width;
        setWidth((prev) => (prev === next ? prev : next));
      }}
      style={{
        height: BUTTON_HEIGHT,
        alignSelf: 'stretch',
        borderRadius: c.cut ? 0 : BUTTON_RADIUS,
        borderWidth: c.cut ? 0 : 1,
        borderColor: c.border,
        backgroundColor: c.cut ? 'transparent' : c.bg,
        overflow: 'hidden',
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {c.cut ? <CutFill width={width} color={c.bg} /> : null}
      {loading ? (
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 0,
            height: BUTTON_HEIGHT,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <ActivityIndicator color={c.fg} />
        </View>
      ) : (
        <Label title={title} color={c.fg} cut={c.cut} icon={icon} />
      )}
    </Pressable>
  );
}
