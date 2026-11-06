import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import useThemeStore from '@/store/themeStore';
import { Avatar, Card } from '@/components/ui';
import { playerAvatarInitials, resolvePlayerAvatarUrl } from '@/lib/playerAvatar';
import { playerDisplayName } from '@/lib/stageDirectories';
import TransferBadge, { transferBadgeSpokenLabel } from './TransferBadge';

function PlayerRow({ entry, selected, onSelect }) {
  const tokens = useThemeStore((s) => s.tokens);
  const { player, badgeType, days_left } = entry;
  const positions = [player.position, player.secondary_position].filter(Boolean).join(' / ');
  const name = playerDisplayName(player);

  return (
    <Pressable
      onPress={() => onSelect?.(entry, { openDetails: true })}
      accessibilityRole="button"
      accessibilityLabel={[name, positions, player.overall_rating ? `OVR ${player.overall_rating}` : '', player.platform,
        transferBadgeSpokenLabel(badgeType, days_left)]
        .filter(Boolean).join(', ')}
      accessibilityState={{ selected }}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        minHeight: 68,
        paddingHorizontal: 12,
        paddingVertical: 12,
        borderRadius: selected ? 12 : 0,
        borderWidth: selected ? 1 : 0,
        borderBottomWidth: 1,
        borderColor: selected ? tokens.cyan : tokens.border,
        backgroundColor: selected ? tokens.card : 'transparent',
        opacity: pressed ? 0.85 : 1,
      })}
    >
      <Avatar uri={resolvePlayerAvatarUrl(player)} initials={playerAvatarInitials(player)} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text
            numberOfLines={1}
            style={{
              color: selected ? tokens.cyan : tokens.text,
              fontSize: 15,
              fontWeight: '700',
              flexShrink: 1,
            }}
          >
            {name}
          </Text>
          <TransferBadge type={badgeType} daysLeft={days_left} />
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
          {positions ? (
            <View style={{ backgroundColor: tokens.border, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2, flexShrink: 1 }}>
              <Text numberOfLines={1} style={{ color: tokens.cyanHi, fontSize: 11, fontWeight: '700' }}>
                {positions}
              </Text>
            </View>
          ) : null}
          {player.overall_rating ? (
            <Text style={{ color: tokens.muted, fontSize: 12 }}>OVR {player.overall_rating}</Text>
          ) : null}
          {player.platform ? (
            <Text numberOfLines={1} style={{ color: tokens.muted, fontSize: 12, flexShrink: 1 }}>{player.platform}</Text>
          ) : null}
        </View>
      </View>
      <Ionicons name="chevron-forward" size={18} color={tokens.muted} />
    </Pressable>
  );
}

export default function TransferPlayerList({ players = [], selectedId, onSelect }) {
  const tokens = useThemeStore((s) => s.tokens);

  if (players.length === 0) {
    return (
      <Card style={{ alignItems: 'center', paddingVertical: 40, gap: 8 }}>
        <Ionicons name="shield-outline" size={36} color={tokens.muted} />
        <Text style={{ color: tokens.text, fontSize: 15, fontWeight: '700', textAlign: 'center' }}>No players found</Text>
        <Text style={{ color: tokens.muted, fontSize: 12, textAlign: 'center' }}>Try adjusting filters</Text>
      </Card>
    );
  }

  return (
    <View>
      {players.map((entry) => (
        <PlayerRow
          key={String(entry.player.id)}
          entry={entry}
          selected={selectedId === entry.player.id}
          onSelect={onSelect}
        />
      ))}
    </View>
  );
}
