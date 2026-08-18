import React from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { headingStyleSm } from '@/lib/fonts';
import { playerAvatarInitials, resolvePlayerAvatarUrl } from '@/lib/playerAvatar';
import { playerDisplayName } from '@/lib/stageDirectories';
import TransferBadge from './TransferBadge';
import { CYAN, GOLD } from './transferHubTheme';

export default function TransferPlayerList({ players = [], selectedId, onSelect }) {
  if (players.length === 0) {
    return (
      <View style={{ borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', backgroundColor: '#071018', paddingVertical: 48, paddingHorizontal: 24, alignItems: 'center' }}>
        <Ionicons name="shield-outline" size={40} color="rgba(245,197,66,0.3)" />
        <Text style={[headingStyleSm, { color: 'rgba(255,255,255,0.55)', marginTop: 12 }]}>No players found</Text>
        <Text style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, marginTop: 8 }}>Try adjusting filters</Text>
      </View>
    );
  }

  return (
    <View style={{ gap: 6 }}>
      {players.map((entry) => {
        const { player, badgeType, days_left } = entry;
        const isSelected = selectedId === player.id;
        const imageUrl = resolvePlayerAvatarUrl(player);
        return (
          <TouchableOpacity
            key={String(player.id)}
            onPress={() => onSelect?.(entry, { openDetails: true })}
            activeOpacity={0.85}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              minHeight: 56,
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderWidth: 1,
              borderColor: isSelected ? 'rgba(245,197,66,0.5)' : 'rgba(255,255,255,0.1)',
              backgroundColor: isSelected ? 'rgba(245,197,66,0.1)' : 'rgba(0,0,0,0.3)',
            }}
          >
            <View
              style={{
                width: 40,
                height: 40,
                overflow: 'hidden',
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.1)',
                backgroundColor: '#071018',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {imageUrl ? (
                <Image source={{ uri: imageUrl }} style={{ width: 40, height: 40 }} />
              ) : (
                <Text style={{ color: GOLD, fontWeight: '900' }}>{playerAvatarInitials(player)}</Text>
              )}
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <Text
                  numberOfLines={1}
                  style={[
                    headingStyleSm,
                    { color: isSelected ? GOLD : '#fff', fontSize: 13, flexShrink: 1 },
                  ]}
                >
                  {playerDisplayName(player)}
                </Text>
                <TransferBadge type={badgeType} daysLeft={days_left} />
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
                {(player.position || player.secondary_position) ? (
                  <View style={{ backgroundColor: 'rgba(0,229,255,0.1)', paddingHorizontal: 6, paddingVertical: 2 }}>
                    <Text style={{ color: CYAN, fontSize: 11, fontWeight: '700' }}>
                      {[player.position, player.secondary_position].filter(Boolean).join(' / ')}
                    </Text>
                  </View>
                ) : null}
                {player.overall_rating ? (
                  <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>OVR {player.overall_rating}</Text>
                ) : null}
                {player.platform ? (
                  <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>{player.platform}</Text>
                ) : null}
              </View>
            </View>
            <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.28)" />
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
