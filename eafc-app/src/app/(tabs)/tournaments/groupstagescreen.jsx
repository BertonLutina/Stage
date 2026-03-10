import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import api from '../../../utils/api';
import GroupTable from '../../../components/tournament/GroupTable';

export default function GroupStageScreen() {
  const { tournamentId } = useLocalSearchParams();
  const [groups, setGroups] = useState([]);

  useEffect(() => {
    api.get(`/tournaments/${tournamentId}/groups`).then(r => setGroups(r.data.data || []));
  }, [tournamentId]);

  return (
    <SafeAreaView className="flex-1 bg-dark">
      <ScrollView className="px-4">
        <Text className="text-white text-xl font-bold mt-4 mb-4">Group Stage</Text>
        {groups.map(g => <GroupTable key={g.id} group={g} />)}
        {!groups.length && <Text className="text-muted text-center mt-8">No group data yet</Text>}
      </ScrollView>
    </SafeAreaView>
  );
}
