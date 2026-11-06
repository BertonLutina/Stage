import React from 'react';
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import useThemeStore from '@/store/themeStore';
import { hexToRgba } from '@/lib/stageTheme';
import { FONT_EA_SPORTS } from '@/lib/fonts';
import TrapeziumPhotoCard from '@/components/profile/TrapeziumPhotoCard';
import { formatPlatformLabel } from '@/lib/platformDisplay';

/** Web club identity card: parallelogram portrait, WR badge, gold tag, console. */
export default function ClubIdentityCard({
  imageUrl,
  tag,
  platform,
  winRate = 0,
  onPress,
  width = 170,
}) {
  const tokens = useThemeStore((s) => s.tokens);
  const height = Math.round(width * 1.12);
  const wr = Number.isFinite(Number(winRate)) ? Math.round(Number(winRate)) : 0;
  const consoleLabel = formatPlatformLabel(platform);

  return (
    <TrapeziumPhotoCard
      width={width}
      height={height}
      imageUrl={imageUrl}
      onPress={onPress}
      fit="contain"
      edgeColor={hexToRgba(tokens.amber, 0.7)}
    >
      {!imageUrl ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="shield" size={42} color={hexToRgba(tokens.amber, 0.35)} />
        </View>
      ) : null}
      <View
        style={{
          position: 'absolute',
          top: 10,
          right: 4,
          transform: [{ skewX: '-12deg' }],
        }}
      >
        <View style={{ backgroundColor: tokens.cyan, minWidth: 38, paddingHorizontal: 7, paddingTop: 3, paddingBottom: 4, alignItems: 'center' }}>
          <View style={{ transform: [{ skewX: '12deg' }], alignItems: 'center' }}>
            <Text style={{ color: tokens.onCyan, fontSize: 8, fontWeight: '800', letterSpacing: 0.8 }}>WR</Text>
            <Text style={{ color: tokens.onCyan, fontFamily: FONT_EA_SPORTS, fontSize: 17, lineHeight: 19 }}>{wr}</Text>
          </View>
        </View>
      </View>
      <View style={{ position: 'absolute', left: 10, right: 10, bottom: 12 }}>
        <Text
          numberOfLines={1}
          style={{ color: tokens.amber, fontSize: 18, fontWeight: '900', letterSpacing: 1.2, textTransform: 'uppercase' }}
        >
          {tag || 'CLUB'}
        </Text>
        {consoleLabel ? (
          <Text numberOfLines={1} style={{ color: tokens.textSoft, fontSize: 11, fontWeight: '600', marginTop: 1 }}>
            {consoleLabel}
          </Text>
        ) : null}
      </View>
    </TrapeziumPhotoCard>
  );
}
