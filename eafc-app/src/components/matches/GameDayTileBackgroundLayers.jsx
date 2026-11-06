import React from 'react';
import { Image, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  gameDayTileImageLayout,
  hasCustomGameDayTileBackground,
} from '@/lib/gameDayTileBackgrounds';
import { STAGE_PALETTE, hexToRgba } from '@/lib/stageTheme';

/** Scrims over a player's photo: bgDeep at three stops keeps text readable on any image. */
const scrim = (top, mid, bottom) => [
  hexToRgba(STAGE_PALETTE.bgDeep, top),
  hexToRgba(STAGE_PALETTE.bgDeep, mid),
  hexToRgba(STAGE_PALETTE.bgDeep, bottom),
];

const OVERLAY = {
  panel: {
    custom: scrim(0.72, 0.58, 0.74),
    default: [hexToRgba(STAGE_PALETTE.card, 0.72), hexToRgba(STAGE_PALETTE.bgDeep, 0.88)],
  },
  card: {
    custom: scrim(0.68, 0.54, 0.72),
    default: scrim(0.82, 0.68, 0.82),
  },
  arena: {
    custom: scrim(0.62, 0.5, 0.68),
    default: null,
  },
};

export default function GameDayTileBackgroundLayers({ config, variant = 'panel' }) {
  const custom = hasCustomGameDayTileBackground(config);
  if (!custom) return null;
  const overlay = OVERLAY[variant]?.custom;
  return (
    <View pointerEvents="none" style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, overflow: 'hidden' }}>
      <Image source={{ uri: config.url }} style={gameDayTileImageLayout(config)} resizeMode="cover" />
      {overlay ? (
        <LinearGradient colors={overlay} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }} />
      ) : null}
    </View>
  );
}
