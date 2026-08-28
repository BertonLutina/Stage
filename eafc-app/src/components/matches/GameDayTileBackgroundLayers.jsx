import React from 'react';
import { Image, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  gameDayTileImageLayout,
  hasCustomGameDayTileBackground,
} from '@/lib/gameDayTileBackgrounds';

const OVERLAY = {
  panel: {
    custom: ['rgba(0,0,0,0.72)', 'rgba(0,0,0,0.58)', 'rgba(0,0,0,0.74)'],
    default: ['rgba(24,30,40,0.72)', 'rgba(7,7,11,0.88)'],
  },
  card: {
    custom: ['rgba(0,0,0,0.68)', 'rgba(0,0,0,0.54)', 'rgba(0,0,0,0.72)'],
    default: ['rgba(25,31,42,0.82)', 'rgba(4,5,9,0.68)', 'rgba(33,39,50,0.82)'],
  },
  arena: {
    custom: ['rgba(0,0,0,0.62)', 'rgba(0,0,0,0.50)', 'rgba(0,0,0,0.68)'],
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
