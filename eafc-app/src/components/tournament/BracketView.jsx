import React, { useMemo } from 'react';
import { ScrollView, View, Text } from 'react-native';
import { normalizeBracketRounds } from '@/lib/bracketRounds';

function matchHomeName(match) {
  return match?.home_club_name || match?.home_player_name || match?.home_team_name || 'TBD';
}

function matchAwayName(match) {
  return match?.away_club_name || match?.away_player_name || match?.away_team_name || 'TBD';
}

function MatchCard({ match }) {
  if (!match || typeof match !== 'object') return null;
  const done = match.status === 'completed' || match.status === 'forfeit';
  return (
    <View className="bg-surface border border-border px-3 py-2 mb-2 flex-row items-center" style={{ borderRadius: 2 }}>
      <Text className="text-white text-xs flex-1 text-right" numberOfLines={1}>{matchHomeName(match)}</Text>
      <View className="mx-2 bg-card px-3 py-1 rounded-lg min-w-[52px] items-center">
        {done ? (
          <Text className="text-primary font-bold text-sm">{match.home_score ?? 0} - {match.away_score ?? 0}</Text>
        ) : (
          <Text className="text-muted text-xs">vs</Text>
        )}
      </View>
      <Text className="text-white text-xs flex-1" numberOfLines={1}>{matchAwayName(match)}</Text>
    </View>
  );
}

export default function BracketView({ rounds = [], matches = null }) {
  const normalized = useMemo(
    () => normalizeBracketRounds(matches != null ? matches : rounds),
    [matches, rounds],
  );

  if (!normalized.length) {
    return <Text className="text-muted text-center py-8">No bracket data</Text>;
  }

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="py-2">
      {normalized.map((round) => (
        <View key={round.id} className="mr-4" style={{ width: 200 }}>
          <Text className="text-primary font-bold text-sm mb-2 text-center">{round.round_name}</Text>
          {(round.matches || []).map((m, matchIndex) => (
            <MatchCard key={String(m?.id ?? `${round.id}-${matchIndex}`)} match={m} />
          ))}
        </View>
      ))}
    </ScrollView>
  );
}
