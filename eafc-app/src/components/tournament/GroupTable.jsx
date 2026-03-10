import React from 'react';
import { View, Text, ScrollView } from 'react-native';

export default function GroupTable({ group }) {
  return (
    <View className="bg-card rounded-2xl border border-border mb-4 overflow-hidden">
      <View className="bg-surface px-4 py-2">
        <Text className="text-primary font-bold text-base">{group.name}</Text>
      </View>
      <View className="flex-row bg-surface/50 px-4 py-1.5 border-b border-border">
        <Text className="text-muted text-xs flex-1">Team</Text>
        <Text className="text-muted text-xs w-8 text-center">P</Text>
        <Text className="text-muted text-xs w-8 text-center">W</Text>
        <Text className="text-muted text-xs w-8 text-center">D</Text>
        <Text className="text-muted text-xs w-8 text-center">L</Text>
        <Text className="text-muted text-xs w-8 text-center">GD</Text>
        <Text className="text-primary text-xs w-8 text-center font-bold">Pts</Text>
      </View>
      {(group.teams || []).map((t, idx) => (
        <View key={t.team_id || idx} className={`flex-row px-4 py-2.5 border-b border-border/50 ${idx % 2 === 0 ? '' : 'bg-surface/20'}`}>
          <View className="flex-row items-center flex-1">
            <Text className="text-muted text-xs w-5">{idx + 1}</Text>
            <Text className="text-white text-sm font-medium" numberOfLines={1}>{t.club_name}</Text>
          </View>
          <Text className="text-white text-xs w-8 text-center">{t.played}</Text>
          <Text className="text-secondary text-xs w-8 text-center">{t.wins}</Text>
          <Text className="text-muted text-xs w-8 text-center">{t.draws}</Text>
          <Text className="text-danger text-xs w-8 text-center">{t.losses}</Text>
          <Text className="text-muted text-xs w-8 text-center">{(t.goals_for || 0) - (t.goals_against || 0)}</Text>
          <Text className="text-primary font-bold text-xs w-8 text-center">{t.points}</Text>
        </View>
      ))}
    </View>
  );
}
