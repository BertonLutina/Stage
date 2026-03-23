import React, { useEffect, useState } from 'react';
import { View, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import api from '../../utils/api';
import Avatar from '../../components/common/Avatar';
import STText from '../../components/common/STText';
import BackButton from '../../components/common/BackButton';

function JerseyCard({ player, isStarter }) {
  return (
    <View className={`items-center p-3 rounded-2xl border w-[30%] mb-3 ${isStarter ? 'bg-surface border-primary/40' : 'bg-card border-border'}`}>
      <View className="relative">
        <Avatar uri={player.avatar} name={`${player.first_name} ${player.last_name}`} size={50} />
        {player.role === 'owner' && (
          <View className="absolute -top-1 -right-1 bg-primary rounded-full w-5 h-5 items-center justify-center">
            <STText style={{ fontSize: 10 }}>👑</STText>
          </View>
        )}
        {player.role === 'captain' && (
          <View className="absolute -top-1 -right-1 bg-accent rounded-full w-5 h-5 items-center justify-center">
            <STText className="text-white text-xs font-bold">C</STText>
          </View>
        )}
      </View>
      <STText className="text-white text-xs font-semibold mt-1.5 text-center" numberOfLines={1}>
        {player.gamer_tag || player.first_name}
      </STText>
      <View className={`mt-1 px-2 py-0.5 rounded-full ${isStarter ? 'bg-primary' : 'bg-muted/30'}`}>
        <STText className={`text-xs font-bold ${isStarter ? 'text-dark' : 'text-muted'}`}>
          {player.position_code || player.position || 'N/A'}
        </STText>
      </View>
    </View>
  );
}

export default function DressingRoomScreen() {
  const { teamId } = useLocalSearchParams();
  const [room, setRoom] = useState(null);

  useEffect(() => {
    api.get(`/teams/${teamId}/dressing-room`).then(r => setRoom(r.data.data));
  }, [teamId]);

  if (!room) return <View className="flex-1 bg-dark items-center justify-center"><STText className="text-muted">Loading dressing room...</STText></View>;

  return (
    <SafeAreaView className="flex-1">
              <BackButton />

      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="bg-surface/50 py-4 px-4 border-b border-border">
          <STText className="text-primary font-black text-2xl text-center">DRESSING ROOM</STText>
          {room.formation && (
            <STText className="text-white text-sm text-center mt-1 font-semibold">Formation: {room.formation.name}</STText>
          )}
        </View>

        <View className="px-4 mt-6">
          <View className="flex-row items-center mb-3">
            <View className="flex-1 h-px bg-primary/40" />
            <STText className="text-primary font-bold mx-3 text-sm">STARTING XI</STText>
            <View className="flex-1 h-px bg-primary/40" />
          </View>
          <View className="flex-row flex-wrap justify-between">
            {room.starters.map(p => <JerseyCard key={p.user_id} player={p} isStarter />)}
          </View>

          {room.substitutes.length > 0 && (
            <>
              <View className="flex-row items-center mb-3 mt-4">
                <View className="flex-1 h-px bg-border" />
                <STText className="text-muted font-bold mx-3 text-sm">BENCH</STText>
                <View className="flex-1 h-px bg-border" />
              </View>
              <View className="flex-row flex-wrap justify-between">
                {room.substitutes.map(p => <JerseyCard key={p.user_id} player={p} isStarter={false} />)}
              </View>
            </>
          )}
        </View>
        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
}
