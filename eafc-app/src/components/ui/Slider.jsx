import React, { useState } from 'react';
import { View } from 'react-native';
import useThemeStore from '@/store/themeStore';
import { MIN_TOUCH } from './metrics';

const TRACK_H = 6;
const THUMB = 24;

function snap(raw, min, max, step) {
  const clamped = Math.min(max, Math.max(min, raw));
  if (!(step > 0)) return clamped;
  const steps = Math.round((clamped - min) / step);
  const decimals = (String(step).split('.')[1] || '').length;
  return Number(Math.min(max, min + steps * step).toFixed(decimals));
}

/**
 * Horizontal slider. Touch or drag the track; screen readers use increment / decrement.
 * `valueText` is the spoken value ("35 %"), `onChange` receives the snapped number.
 */
export default function Slider({
  value,
  min = 0,
  max = 1,
  step = 0.01,
  onChange,
  accessibilityLabel,
  valueText,
  disabled = false,
  testID = 'slider-track',
}) {
  const tokens = useThemeStore((s) => s.tokens);
  const [width, setWidth] = useState(0);
  const range = max - min || 1;
  const ratio = Math.min(1, Math.max(0, (Number(value) - min) / range));

  const fromX = (x) => {
    if (disabled || !width || !onChange) return;
    onChange(snap(min + (Number(x) / width) * range, min, max, step));
  };
  const nudge = (direction) => {
    if (disabled || !onChange) return;
    onChange(snap(Number(value) + direction * step, min, max, step));
  };

  return (
    <View
      testID={testID}
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ min, max, now: Number(value), text: valueText }}
      accessibilityState={{ disabled }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={(event) => {
        const action = event?.nativeEvent?.actionName;
        if (action === 'increment') nudge(1);
        if (action === 'decrement') nudge(-1);
      }}
      onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
      onStartShouldSetResponder={() => !disabled}
      onMoveShouldSetResponder={() => !disabled}
      onResponderGrant={(event) => fromX(event.nativeEvent.locationX)}
      onResponderMove={(event) => fromX(event.nativeEvent.locationX)}
      style={{ height: MIN_TOUCH, justifyContent: 'center', opacity: disabled ? 0.5 : 1 }}
    >
      <View style={{ height: TRACK_H, borderRadius: TRACK_H / 2, backgroundColor: tokens.border }} pointerEvents="none">
        <View style={{ width: `${ratio * 100}%`, height: TRACK_H, borderRadius: TRACK_H / 2, backgroundColor: tokens.cyan }} />
      </View>
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          left: Math.max(0, ratio * (width - THUMB)),
          width: THUMB,
          height: THUMB,
          borderRadius: THUMB / 2,
          backgroundColor: tokens.cyan,
          borderWidth: 3,
          borderColor: tokens.bgDeep,
        }}
      />
    </View>
  );
}
