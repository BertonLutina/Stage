import React, { useMemo } from 'react';
import { ScrollView, View, Text } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import useThemeStore from '@/store/themeStore';
import { normalizeBracketRounds } from '@/lib/bracketRounds';

const COLUMN_WIDTH = 150;
const CONNECTOR_WIDTH = 20;
const SLOT_HEIGHT = 80; // one match slot in the widest round: 63px card + breathing room
const LABEL_HEIGHT = 28;
const CARD_RADIUS = 10;

function matchHomeName(match) {
  return match?.home_club_name || match?.home_player_name || match?.home_team_name || 'TBD';
}

function matchAwayName(match) {
  return match?.away_club_name || match?.away_player_name || match?.away_team_name || 'TBD';
}

function TeamLine({ tokens, name, score, winner, loser, divider }) {
  const tbd = name === 'TBD';
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 6,
        paddingVertical: 7,
        paddingHorizontal: 8,
        borderTopWidth: divider ? 1 : 0,
        borderTopColor: tokens.border,
      }}
    >
      <Text
        numberOfLines={1}
        style={{
          flex: 1,
          fontSize: 12,
          lineHeight: 16,
          fontWeight: winner ? '700' : '500',
          color: tbd || loser ? tokens.muted : tokens.text,
        }}
      >
        {name}
      </Text>
      <Text
        style={{
          fontSize: 12,
          lineHeight: 16,
          fontWeight: winner ? '700' : '500',
          color: score == null || loser ? tokens.muted : tokens.text,
          fontVariant: ['tabular-nums'],
        }}
      >
        {score == null ? '–' : score}
      </Text>
    </View>
  );
}

function MatchCard({ match, tokens }) {
  if (!match || typeof match !== 'object') return null;
  const done = match.status === 'completed' || match.status === 'forfeit';
  const home = done ? (match.home_score ?? 0) : null;
  const away = done ? (match.away_score ?? 0) : null;
  const homeWins = done && home > away;
  const awayWins = done && away > home;
  return (
    <View
      style={{
        backgroundColor: tokens.card,
        borderWidth: 1,
        borderColor: tokens.border,
        borderRadius: CARD_RADIUS,
        overflow: 'hidden',
      }}
    >
      <TeamLine tokens={tokens} name={matchHomeName(match)} score={home} winner={homeWins} loser={awayWins} />
      <TeamLine tokens={tokens} name={matchAwayName(match)} score={away} winner={awayWins} loser={homeWins} divider />
    </View>
  );
}

/**
 * Bracket connector: one "]" per pair of previous-round matches, drawn from the centre
 * of the upper match to the centre of the lower one so it meets the next-round card.
 */
function Connector({ tokens, pairs, height }) {
  const slot = height / (pairs * 2);
  return (
    <View style={{ width: CONNECTOR_WIDTH, height, marginTop: LABEL_HEIGHT }}>
      {Array.from({ length: pairs }, (_, j) => (
        <View
          key={j}
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: (2 * j + 0.5) * slot,
            height: slot,
            borderWidth: 2,
            borderLeftWidth: 0,
            borderColor: tokens.borderStrong,
            borderTopRightRadius: 8,
            borderBottomRightRadius: 8,
          }}
        />
      ))}
    </View>
  );
}

export default function BracketView({ rounds = [], matches = null }) {
  const tokens = useThemeStore((s) => s.tokens);
  const normalized = useMemo(
    () => normalizeBracketRounds(matches != null ? matches : rounds),
    [matches, rounds],
  );

  if (!normalized.length) {
    return (
      <Text style={{ color: tokens.muted, textAlign: 'center', paddingVertical: 32, fontSize: 14 }}>
        No bracket data
      </Text>
    );
  }

  const widest = Math.max(1, ...normalized.map((round) => (round.matches || []).length));
  const bodyHeight = widest * SLOT_HEIGHT;

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }}>
      <View style={{ flexDirection: 'row', paddingVertical: 8 }}>
        {normalized.map((round, roundIndex) => {
          const count = (round.matches || []).length;
          const prev = roundIndex > 0 ? (normalized[roundIndex - 1].matches || []).length : 0;
          const isFinal = /^final$/i.test(round.round_name);
          return (
            <React.Fragment key={round.id}>
              {prev > 0 && prev === count * 2 ? (
                <Connector tokens={tokens} pairs={count} height={bodyHeight} />
              ) : roundIndex > 0 ? (
                <View style={{ width: CONNECTOR_WIDTH }} />
              ) : null}
              <View style={{ width: COLUMN_WIDTH }}>
                <View
                  style={{
                    height: LABEL_HEIGHT,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  {isFinal ? <Ionicons name="trophy-outline" size={16} color={tokens.warning} /> : null}
                  <Text
                    numberOfLines={1}
                    style={{
                      flexShrink: 1,
                      color: tokens.muted,
                      fontSize: 11,
                      fontWeight: '600',
                      letterSpacing: 11 * 0.12,
                      textTransform: 'uppercase',
                    }}
                  >
                    {round.round_name}
                  </Text>
                </View>
                <View style={{ height: bodyHeight, justifyContent: 'space-around' }}>
                  {(round.matches || []).map((m, matchIndex) => (
                    <MatchCard key={String(m?.id ?? `${round.id}-${matchIndex}`)} match={m} tokens={tokens} />
                  ))}
                </View>
              </View>
            </React.Fragment>
          );
        })}
      </View>
    </ScrollView>
  );
}
