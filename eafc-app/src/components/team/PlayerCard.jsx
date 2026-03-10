import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Avatar from '../common/Avatar';

const ROLE_BADGE = { owner: { label: 'Owner', color: 'bg-primary', text: 'text-dark' }, captain: { label: 'C', color: 'bg-accent', text: 'text-white' }, sub: { label: 'SUB', color: 'bg-muted', text: 'text-white' } };

export default function PlayerCard({ player, onPress, compact = false }) {
  const badge = ROLE_BADGE[player.role];
  if (compact) {
    return (
      <TouchableOpacity onPress={onPress} className="flex-row items-center bg-card border border-border rounded-xl px-3 py-2 mb-2">
        <Avatar uri={player.avatar} name={`${player.first_name} ${player.last_name}`} size={36} />
        <View className="flex-1 ml-3">
          <Text className="text-white font-semibold text-sm">{player.gamer_tag || `${player.first_name} ${player.last_name}`}</Text>
          <Text className="text-muted text-xs">{player.position || player.position_code || 'No position'}</Text>
        </View>
        {badge ? <View className={`${badge.color} px-2 py-0.5 rounded-full`}><Text className={`${badge.text} text-xs font-bold`}>{badge.label}</Text></View> : null}
      </TouchableOpacity>
    );
  }
  return (
    <TouchableOpacity onPress={onPress} className="bg-card border border-border rounded-2xl p-4 mb-3 items-center">
      <View className="relative">
        <Avatar uri={player.avatar} name={`${player.first_name} ${player.last_name}`} size={64} />
        {badge ? (
          <View className={`absolute -top-1 -right-1 ${badge.color} rounded-full w-6 h-6 items-center justify-center`}>
            <Text className={`${badge.text} text-xs font-bold`}>{badge.label === 'Owner' ? '👑' : badge.label}</Text>
          </View>
        ) : null}
      </View>
      <Text className="text-white font-bold mt-2">{player.gamer_tag || `${player.first_name} ${player.last_name}`}</Text>
      <View className="bg-surface rounded-full px-3 py-1 mt-1">
        <Text className="text-primary text-xs font-bold">{player.position || player.position_code || 'Player'}</Text>
      </View>
      {player.jersey_number ? <Text className="text-muted text-xs mt-1">#{player.jersey_number}</Text> : null}
    </TouchableOpacity>
  );
}
