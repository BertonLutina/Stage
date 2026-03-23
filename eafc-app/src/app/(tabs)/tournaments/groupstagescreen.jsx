import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import api from '../../../utils/api';
import GroupTable from '../../../components/tournament/GroupTable';
import GradientBackground from '../../../components/common/GradientBackground';
import BackButton from '../../../components/common/BackButton';

export default function GroupStageScreen() {
  const { tournamentId } = useLocalSearchParams();
  const [groups, setGroups] = useState([]);

  useEffect(() => {
    api.get(`/tournaments/${tournamentId}/groups`).then(r => setGroups(r.data.data || []));
  }, [tournamentId]);

  return (
    <View className="flex-1">
      <GradientBackground>
        <SafeAreaView className="flex-1">
          <View className="flex-row items-center gap-4 px-4 py-3 border-b border-white/10">
            <BackButton variant="light" />
            <Text className="text-white text-xl font-bold flex-1">Group Stage</Text>
          </View>
          <ScrollView className="px-4">
            {groups.map(g => <GroupTable key={g.id} group={g} />)}
            {!groups.length && <Text className="text-muted text-center mt-8">No group data yet</Text>}
          </ScrollView>
        </SafeAreaView>
      </GradientBackground>
    </View>
  );
}
