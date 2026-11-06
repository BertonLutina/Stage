import React from 'react';
import { Image } from 'react-native';

/**
 * Official Stage brand logo (design spec, 6 Nov 2026). Keeps the asset's
 * native aspect ratio from a given `width`.
 *
 *   variant="lockup"  → stage-logo.png (1600×304): wordmark + stadium
 *   variant="mark"    → stage-icon.png (461×220): stadium mark alone
 */
const ASSETS = {
  lockup: { source: require('../../../assets/brand/stage-logo.png'), w: 1600, h: 304 },
  mark: { source: require('../../../assets/brand/stage-icon.png'), w: 461, h: 220 },
};

export default function BrandLogo({ variant = 'lockup', width = 160, style, testID = 'brand-logo' }) {
  const asset = ASSETS[variant] || ASSETS.lockup;
  const height = width * (asset.h / asset.w);
  return (
    <Image
      testID={testID}
      source={asset.source}
      accessibilityLabel="Stage"
      accessibilityRole="image"
      resizeMode="contain"
      style={[{ width, height }, style]}
    />
  );
}
