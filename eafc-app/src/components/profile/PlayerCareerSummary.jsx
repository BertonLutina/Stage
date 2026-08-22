import React from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GamerSectionCard, useGamerTokens } from '@/components/profile/gamer/GamerProfileUI';
import {
  CAREER_LABELS,
  clubCareerTiles,
  playerCareerTiles,
  recentCareerHistory,
} from '@/lib/playerCareer';

const OUTCOME = {
  W: { color: '#34D399', bg: 'rgba(16,185,129,0.18)', border: 'rgba(52,211,153,0.4)' },
  D: { color: '#FFD60A', bg: 'rgba(255,214,10,0.14)', border: 'rgba(255,214,10,0.35)' },
  L: { color: '#FB7185', bg: 'rgba(244,63,94,0.16)', border: 'rgba(251,113,133,0.4)' },
};

function tileColor(accent, tokens) {
  if (accent === 'amber' || accent === 'gold') return tokens.amber;
  if (accent === 'green') return '#34D399';
  if (accent === 'rose') return '#FB7185';
  if (accent === 'violet') return '#C4B5FD';
  return tokens.cyan;
}

function CareerTile({ label, value, accent, tokens }) {
  const color = tileColor(accent, tokens);
  return (
    <View
      style={{
        width: '31%',
        flexGrow: 1,
        minWidth: 84,
        minHeight: 68,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: tokens.hairline,
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
          fontSize: 10,
          fontWeight: '800',
          letterSpacing: 1.1,
          textTransform: 'uppercase',
          lineHeight: 13,
        }}
      >
        {label}
      </Text>
      <Text
        numberOfLines={1}
        style={{
          color,
          fontSize: 24,
          fontWeight: '900',
          letterSpacing: -0.6,
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
    <View style={{ marginTop: 4, paddingTop: 12, borderTopWidth: 1, borderTopColor: tokens.hairline }}>
      <Text style={{ color: tokens.muted, fontSize: 10, fontWeight: '800', letterSpacing: 1.6, textTransform: 'uppercase', marginBottom: 10 }}>
        {CAREER_LABELS.recentMatches}
      </Text>
      <View style={{ gap: 8 }}>
        {rows.map((row) => {
          const chip = OUTCOME[row.outcome];
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
                borderColor: tokens.hairline,
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
                <Text style={{ color: tokens.text, fontSize: 13, fontWeight: '700' }} numberOfLines={1}>
                  {row.title}
                </Text>
                <Text style={{ color: tokens.muted, fontSize: 11, marginTop: 2 }} numberOfLines={1}>
                  {row.meta}
                </Text>
              </View>
              <Text style={{ color: tokens.text, fontSize: 16, fontWeight: '900', fontVariant: ['tabular-nums'] }}>
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
