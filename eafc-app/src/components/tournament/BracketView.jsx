import React from 'react';
import { ScrollView, View, Text } from 'react-native';

function MatchCard({ match }) {
  const done = match.status === 'completed';
  return (
    <View className="bg-surface border border-border rounded-xl px-3 py-2 mb-2 flex-row items-center">
      <Text className="text-white text-xs flex-1 text-right" numberOfLines={1}>{match.home_team_name}</Text>
      <View className="mx-2 bg-card px-3 py-1 rounded-lg min-w-[52px] items-center">
        {done ? (
          <Text className="text-primary font-bold text-sm">{match.home_score} - {match.away_score}</Text>
        ) : (
          <Text className="text-muted text-xs">vs</Text>
        )}
      </View>
      <Text className="text-white text-xs flex-1" numberOfLines={1}>{match.away_team_name}</Text>
    </View>
  );
}

export default function BracketView({ rounds = [] }) {
  if (!rounds.length) return <Text className="text-muted text-center py-8">No bracket data</Text>;
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="py-2">
      {rounds.map((round) => (
        <View key={round.id} className="mr-4" style={{ width: 200 }}>
          <Text className="text-primary font-bold text-sm mb-2 text-center">{round.round_name}</Text>
          {(round.matches || []).map((m) => (
            <MatchCard key={m.id} match={m} />
          ))}
        </View>
      ))}
    </ScrollView>
  );
}
