import React, { useState, useEffect } from 'react';
import { Image, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { headingStyle } from '@/lib/fonts';
import { playerAvatarInitials, resolvePlayerAvatarUrl } from '@/lib/playerAvatar';
import { CYAN, GOLD, GOLD_DARK, GOLD_LIGHT } from './transferHubTheme';

export default function TransferPlayerPhotoCard({
  player,
  focused = false,
  width = 168,
  children,
}) {
  const [imageFailed, setImageFailed] = useState(false);
  const height = Math.round(width * (4 / 3));
  const imageUrl = resolvePlayerAvatarUrl(player);
  useEffect(() => { setImageFailed(false); }, [imageUrl]);
  const ovrRaw = player?.overall_rating;
  const ovr = ovrRaw == null || ovrRaw === ''
    ? 70
    : Math.round(Number(ovrRaw) * 10) / 10;
  const resolvedOverall = ovr === 0 ? '0.0' : (Number.isInteger(ovr) ? String(ovr) : ovr.toFixed(1));
  const position = player?.position || '—';
  const frame = focused
    ? [GOLD_LIGHT, GOLD, GOLD_DARK]
    : ['rgba(0,229,255,0.55)', 'rgba(0,229,255,0.18)', 'rgba(0,229,255,0.08)'];

  return (
    <View
      style={{
        width,
        height,
        shadowColor: focused ? GOLD : CYAN,
        shadowOpacity: focused ? 0.55 : 0.18,
        shadowRadius: focused ? 22 : 10,
        shadowOffset: { width: 0, height: 8 },
        elevation: focused ? 14 : 4,
      }}
    >
      <LinearGradient
        colors={frame}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ borderRadius: 18, padding: focused ? 2.5 : 1.5, height, width }}
      >
        <View
          style={{
            flex: 1,
            borderRadius: 16,
            overflow: 'hidden',
            backgroundColor: '#0d1528',
          }}
        >
          {imageUrl && !imageFailed ? (
            <Image
              source={{ uri: imageUrl }}
              onError={() => setImageFailed(true)}
              resizeMode="cover"
              style={{ position: 'absolute', width: '100%', height: '100%' }}
            />
          ) : (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 42, fontWeight: '900' }}>
                {playerAvatarInitials(player)}
              </Text>
            </View>
          )}

          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.18)', 'rgba(0,0,0,0.82)']}
            locations={[0.35, 0.62, 1]}
            style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
            pointerEvents="none"
          />

          <View style={{ position: 'absolute', top: 8, right: 8, minWidth: 42, borderRadius: 8, overflow: 'hidden' }}>
            <LinearGradient colors={[GOLD_LIGHT, GOLD, GOLD_DARK]} style={{ paddingHorizontal: 8, paddingVertical: 5, alignItems: 'center' }}>
              <Text style={{ color: 'rgba(0,0,0,0.7)', fontSize: 8, fontWeight: '900', letterSpacing: 1 }}>OVR</Text>
              <Text style={[headingStyle, { color: '#000', fontSize: 18, letterSpacing: 0, lineHeight: 20 }]}>
                {resolvedOverall}
              </Text>
            </LinearGradient>
          </View>

          <View style={{ position: 'absolute', left: 10, right: 10, bottom: 10 }}>
            <Text style={[headingStyle, { color: '#fff', fontSize: 18, letterSpacing: 0.4 }]}>
              {String(position).toUpperCase()}
            </Text>
            {player?.shirt_number != null && player?.shirt_number !== '' ? (
              <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: '700', marginTop: 2 }}>
                #{player.shirt_number}
              </Text>
            ) : null}
          </View>

          {children}
        </View>
      </LinearGradient>
    </View>
  );
}
