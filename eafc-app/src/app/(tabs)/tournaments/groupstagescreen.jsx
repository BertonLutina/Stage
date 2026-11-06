import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import api from '../../../utils/api';
import useThemeStore from '@/store/themeStore';
import { Screen } from '@/components/ui';
import GroupTable from '../../../components/tournament/GroupTable';
import CompetitionHeader from '../../../components/tournament/CompetitionHeader';

export default function GroupStageScreen() {
  const { tournamentId } = useLocalSearchParams();
  const tokens = useThemeStore((s) => s.tokens);
  const [groups, setGroups] = useState([]);

  useEffect(() => {
    api.get(`/tournaments/${tournamentId}/groups`).then(r => setGroups(r.data.data || []));
  }, [tournamentId]);

  return (
    <Screen>
      <View style={{ gap: 14 }}>
        <CompetitionHeader title="Group stage" />
        {groups.map(g => <GroupTable key={g.id} group={g} />)}
        {!groups.length && (
          <Text style={{ color: tokens.muted, textAlign: 'center', marginTop: 32, fontSize: 14 }}>
            No group data yet
          </Text>
        )}
      </View>
    </Screen>
  );
}
