import React from 'react';
import { View } from 'react-native';

/** Subtle parallelogram frame via skew — counter-skew children for readable text. */
export default function ParallelogramFrame({
  children,
  skew = -10,
  style,
  innerStyle,
  contentStyle,
}) {
  return (
    <View style={[{ transform: [{ skewX: `${skew}deg` }] }, style]}>
      <View style={[{ transform: [{ skewX: `${-skew}deg` }] }, innerStyle]}>
        <View style={contentStyle}>{children}</View>
      </View>
    </View>
  );
}

export function parallelogramTabStyle(active) {
  return {
    borderWidth: 1,
    borderColor: active ? 'rgba(0,229,255,0.55)' : 'rgba(0,229,255,0.15)',
    backgroundColor: active ? 'rgba(0,229,255,0.18)' : 'rgba(6,17,29,0.82)',
    paddingHorizontal: 18,
    paddingVertical: 11,
    minHeight: 44,
    justifyContent: 'center',
  };
}

export function parallelogramTabTextStyle(active) {
  return {
    color: active ? '#E0FBFF' : 'rgba(0,229,255,0.45)',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.8,
    textTransform: 'uppercase',
  };
}
