import React from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GamerSectionCard, statAccentColor, useGamerTokens } from '@/components/profile/gamer/GamerProfileUI';
import { FONT_EA_SPORTS } from '@/lib/fonts';
import { hexToRgba } from '@/lib/stageTheme';
import {
  CAREER_LABELS,
  clubCareerTiles,
  playerCareerTiles,
  recentCareerHistory,
} from '@/lib/playerCareer';

function outcomeChip(outcome, tokens) {
  if (outcome === 'W') return { color: tokens.success, bg: hexToRgba(tokens.success, 0.18), border: hexToRgba(tokens.success, 0.4) };
  if (outcome === 'D') return { color: tokens.amber, bg: hexToRgba(tokens.amber, 0.14), border: tokens.amberBorder };
  if (outcome === 'L') return { color: tokens.danger, bg: hexToRgba(tokens.danger, 0.16), border: hexToRgba(tokens.danger, 0.4) };
  return null;
}

function CareerTile({ label, value, accent, tokens }) {
  const color = statAccentColor(accent, tokens);
  return (
    <View
      style={{
        width: '31%',
        flexGrow: 1,
        minWidth: 84,
        minHeight: 68,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: tokens.border,
        backgroundColor: tokens.inputFill,
        paddingHorizontal: 10,
        paddingVertical: 8,
        justifyContent: 'space-between',
      }}
    >
      <Text
        numberOfLines={2}
        style={{
          color: tokens.muted,
          fontSize: 11,
          fontWeight: '600',
          letterSpacing: 11 * 0.12,
          textTransform: 'uppercase',
          lineHeight: 14,
        }}
      >
        {label}
      </Text>
      <Text
        numberOfLines={1}
        style={{
          color,
          fontFamily: FONT_EA_SPORTS,
          fontSize: 24,
          fontVariant: ['tabular-nums'],
          marginTop: 8,
        }}
      >
        {value}
      </Text>
    </View>
  );
}

function StatGrid({ tiles, tokens }) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
      {tiles.map((tile) => (
        <CareerTile key={tile.label} {...tile} tokens={tokens} />
      ))}
    </View>
  );
}

function HistoryRows({ history, playerCareer, tokens }) {
  const rows = recentCareerHistory(history, { playerCareer });
  if (rows.length === 0) {
    return (
      <Text style={{ color: tokens.muted, fontSize: 13, marginTop: 4 }}>
        {CAREER_LABELS.noRecentMatches}
      </Text>
    );
  }

  return (
    <View style={{ marginTop: 4, paddingTop: 12, borderTopWidth: 1, borderTopColor: tokens.border }}>
      <Text style={{ color: tokens.muted, fontSize: 11, fontWeight: '600', letterSpacing: 11 * 0.12, textTransform: 'uppercase', marginBottom: 10 }}>
        {CAREER_LABELS.recentMatches}
      </Text>
      <View style={{ gap: 8 }}>
        {rows.map((row) => {
          const chip = outcomeChip(row.outcome, tokens);
          return (
            <View
              key={row.key}
              style={{
                minHeight: 52,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: tokens.border,
                backgroundColor: tokens.inputFill,
                paddingHorizontal: 12,
                paddingVertical: 10,
              }}
            >
              {chip ? (
                <View style={{
                  minWidth: 32,
                  minHeight: 32,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: chip.border,
                  backgroundColor: chip.bg,
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingHorizontal: 8,
                }}
                >
                  <Text style={{ color: chip.color, fontSize: 11, fontWeight: '900' }}>{row.outcome}</Text>
                </View>
              ) : (
                <Ionicons name="flash-outline" size={16} color={tokens.cyan} />
              )}
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={{ color: tokens.text, fontSize: 14, fontWeight: '600' }} numberOfLines={1}>
                  {row.title}
                </Text>
                <Text style={{ color: tokens.muted, fontSize: 11, marginTop: 2 }} numberOfLines={1}>
                  {row.meta}
                </Text>
              </View>
              <Text style={{ color: tokens.text, fontFamily: FONT_EA_SPORTS, fontSize: 18, fontVariant: ['tabular-nums'] }}>
                {row.score}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function CareerSection({ eyebrow, title, tiles, history, playerCareer, tokens }) {
  return (
    <GamerSectionCard eyebrow={eyebrow} title={title}>
      <View style={{ gap: 12 }}>
        <StatGrid tiles={tiles} tokens={tokens} />
        <HistoryRows history={history} playerCareer={playerCareer} tokens={tokens} />
      </View>
    </GamerSectionCard>
  );
}

export default function PlayerCareerSummary({ career, loading }) {
  const tokens = useGamerTokens();
  const club = career?.club_career || {};
  const player = career?.player_career || {};

  if (loading) {
    return (
      <GamerSectionCard>
        <View style={{ paddingVertical: 28, alignItems: 'center', gap: 10 }}>
          <ActivityIndicator color={tokens.cyan} />
          <Text style={{ color: tokens.muted, fontSize: 13 }}>{CAREER_LABELS.loading}</Text>
        </View>
      </GamerSectionCard>
    );
  }

  return (
    <View style={{ gap: 12 }}>
      <CareerSection
        eyebrow={CAREER_LABELS.clubEyebrow}
        title={CAREER_LABELS.clubTitle}
        tiles={clubCareerTiles(club)}
        history={club.history}
        tokens={tokens}
      />
      <CareerSection
        eyebrow={CAREER_LABELS.playerEyebrow}
        title={CAREER_LABELS.playerTitle}
        tiles={playerCareerTiles(player)}
        history={player.history}
        playerCareer
        tokens={tokens}
      />
      {!career ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 4 }}>
          <Ionicons name="trophy-outline" size={14} color={tokens.faint} />
          <Text style={{ color: tokens.faint, fontSize: 12 }}>{CAREER_LABELS.unavailable}</Text>
        </View>
      ) : null}
    </View>
  );
}
