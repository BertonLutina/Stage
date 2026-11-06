import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import useThemeStore from '@/store/themeStore';
import { FONT_EA_SPORTS } from '@/lib/fonts';
import { Avatar, Card } from '@/components/ui';
import { playerAvatarInitials, resolvePlayerAvatarUrl } from '@/lib/playerAvatar';
import { clubDisplayName, clubOverallRating, playerDisplayName } from '@/lib/stageDirectories';

/** Club OVR can be an average: show it like the club card does (integers plain, otherwise 1 decimal). */
function formatClubOvr(raw) {
  if (raw == null) return null;
  const rounded = Math.round(Number(raw) * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

/** Same result-row pattern as the Search mockup: avatar tile, name + meta, OVR on the right. */
function DirectoryRow({
  selected, imageUrl, initials, name, meta, ovr, a11yLabel, onPress,
}) {
  const tokens = useThemeStore((s) => s.tokens);
  const hasOvr = ovr != null && ovr !== '';

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={a11yLabel}
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
      <Avatar uri={imageUrl} initials={initials} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text numberOfLines={1} style={{ color: tokens.text, fontSize: 15, fontWeight: '700' }}>
          {name}
        </Text>
        {meta ? (
          <Text numberOfLines={1} style={{ color: tokens.muted, fontSize: 12, marginTop: 2 }}>
            {meta}
          </Text>
        ) : null}
      </View>
      {hasOvr ? (
        <Text
          numberOfLines={1}
          style={{
            minWidth: 34,
            textAlign: 'right',
            color: tokens.cyan,
            fontFamily: FONT_EA_SPORTS,
            fontSize: 20,
          }}
        >
          {ovr}
        </Text>
      ) : null}
    </Pressable>
  );
}

function EmptyList({ icon, title }) {
  const tokens = useThemeStore((s) => s.tokens);
  return (
    <Card style={{ alignItems: 'center', paddingVertical: 40, gap: 8 }}>
      <Ionicons name={icon} size={36} color={tokens.muted} />
      <Text style={{ color: tokens.text, fontSize: 15, fontWeight: '700', textAlign: 'center' }}>{title}</Text>
      <Text style={{ color: tokens.muted, fontSize: 12, textAlign: 'center' }}>Try adjusting filters</Text>
    </Card>
  );
}

function joinParts(parts, separator = ' · ') {
  return parts.filter(Boolean).join(separator);
}

export function DirectoryPlayerList({ players = [], selectedId, onSelect }) {
  if (players.length === 0) {
    return <EmptyList icon="people-outline" title="No players found" />;
  }

  return (
    <View>
      {players.map((player) => {
        const isSelected = String(selectedId) === String(player.id);
        const name = playerDisplayName(player);
        const ovr = player.overall_rating || null;
        const meta = joinParts([player.position, player.platform]);
        return (
          <DirectoryRow
            key={String(player.id)}
            selected={isSelected}
            imageUrl={resolvePlayerAvatarUrl(player)}
            initials={playerAvatarInitials(player)}
            name={name}
            meta={meta}
            ovr={ovr}
            a11yLabel={joinParts([name, player.position, ovr ? `OVR ${ovr}` : null, player.platform], ', ')}
            onPress={() => onSelect?.(player, { openDetails: true })}
          />
        );
      })}
    </View>
  );
}

export function DirectoryClubList({ clubs = [], selectedId, onSelect }) {
  if (clubs.length === 0) {
    return <EmptyList icon="shield-outline" title="No clubs found" />;
  }

  return (
    <View>
      {clubs.map((club) => {
        const isSelected = String(selectedId) === String(club.id);
        const name = clubDisplayName(club);
        const ovr = formatClubOvr(clubOverallRating(club));
        const meta = joinParts([club.tag, club.region, club.platform]);
        const initials = String(club.tag || name || 'C').slice(0, 3).toUpperCase();
        return (
          <DirectoryRow
            key={String(club.id)}
            selected={isSelected}
            imageUrl={club.logo_url}
            initials={initials}
            name={name}
            meta={meta}
            ovr={ovr}
            a11yLabel={joinParts([name, club.tag, club.region, ovr != null ? `OVR ${ovr}` : null, club.platform], ', ')}
            onPress={() => onSelect?.(club, { openDetails: true })}
          />
        );
      })}
    </View>
  );
}
