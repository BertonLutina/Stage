import React from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { headingStyleSm } from '@/lib/fonts';
import { playerAvatarInitials, resolvePlayerAvatarUrl } from '@/lib/playerAvatar';
import { clubDisplayName, clubOverallRating, playerDisplayName } from '@/lib/stageDirectories';
import { SILVER, TILE_HAIRLINE } from '@/components/transfer/transferHubTheme';

export function DirectoryPlayerList({ players = [], selectedId, onSelect }) {
  if (players.length === 0) {
    return (
      <View style={{ borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', backgroundColor: '#071018', paddingVertical: 48, paddingHorizontal: 24, alignItems: 'center' }}>
        <Ionicons name="people-outline" size={40} color="rgba(238,243,251,0.28)" />
        <Text style={[headingStyleSm, { color: 'rgba(255,255,255,0.55)', marginTop: 12 }]}>No players found</Text>
        <Text style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, marginTop: 8 }}>Try adjusting filters</Text>
      </View>
    );
  }

  return (
    <View style={{ gap: 6 }}>
      {players.map((player) => {
        const isSelected = String(selectedId) === String(player.id);
        const imageUrl = resolvePlayerAvatarUrl(player);
        return (
          <TouchableOpacity
            key={String(player.id)}
            onPress={() => onSelect?.(player, { openDetails: true })}
            activeOpacity={0.85}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              minHeight: 56,
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderWidth: 1,
              borderColor: isSelected ? 'rgba(248,251,255,0.5)' : TILE_HAIRLINE,
              backgroundColor: isSelected ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.3)',
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
                <Text style={{ color: SILVER, fontWeight: '900' }}>{playerAvatarInitials(player)}</Text>
              )}
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text
                numberOfLines={1}
                style={[headingStyleSm, { color: isSelected ? SILVER : '#fff', fontSize: 13 }]}
              >
                {playerDisplayName(player)}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
                {player.position ? (
                  <View style={{ backgroundColor: 'rgba(238,243,251,0.1)', paddingHorizontal: 6, paddingVertical: 2 }}>
                    <Text style={{ color: SILVER, fontSize: 11, fontWeight: '700' }}>{player.position}</Text>
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

export function DirectoryClubList({ clubs = [], selectedId, onSelect }) {
  if (clubs.length === 0) {
    return (
      <View style={{ borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', backgroundColor: '#071018', paddingVertical: 48, paddingHorizontal: 24, alignItems: 'center' }}>
        <Ionicons name="shield-outline" size={40} color="rgba(238,243,251,0.28)" />
        <Text style={[headingStyleSm, { color: 'rgba(255,255,255,0.55)', marginTop: 12 }]}>No clubs found</Text>
        <Text style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, marginTop: 8 }}>Try adjusting filters</Text>
      </View>
    );
  }

  return (
    <View style={{ gap: 6 }}>
      {clubs.map((club) => {
        const isSelected = String(selectedId) === String(club.id);
        const ovr = clubOverallRating(club);
        return (
          <TouchableOpacity
            key={String(club.id)}
            onPress={() => onSelect?.(club, { openDetails: true })}
            activeOpacity={0.85}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              minHeight: 56,
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderWidth: 1,
              borderColor: isSelected ? 'rgba(248,251,255,0.5)' : TILE_HAIRLINE,
              backgroundColor: isSelected ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.3)',
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
              {club.logo_url ? (
                <Image source={{ uri: club.logo_url }} style={{ width: 40, height: 40 }} />
              ) : (
                <Ionicons name="shield-outline" size={18} color={SILVER} />
              )}
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text
                numberOfLines={1}
                style={[headingStyleSm, { color: isSelected ? SILVER : '#fff', fontSize: 13 }]}
              >
                {clubDisplayName(club)}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
                {club.tag ? (
                  <View style={{ backgroundColor: 'rgba(238,243,251,0.1)', paddingHorizontal: 6, paddingVertical: 2 }}>
                    <Text style={{ color: SILVER, fontSize: 11, fontWeight: '700' }}>{club.tag}</Text>
                  </View>
                ) : null}
                {ovr != null ? (
                  <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>OVR {ovr}</Text>
                ) : null}
                {club.region ? (
                  <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>{club.region}</Text>
                ) : null}
                {club.platform ? (
                  <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>{club.platform}</Text>
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
