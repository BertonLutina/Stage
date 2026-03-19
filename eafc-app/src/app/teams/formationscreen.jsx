import React, { useEffect, useState } from 'react';
import { View, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import api from '../../utils/api';
import FormationView from '../../components/team/FormationView';
import Button from '../../components/common/Button';
import STText from '../../components/common/STText';

const FORMATIONS = ['4-3-3', '4-4-2', '3-5-2', '4-2-3-1'];
const POSITIONS = ['GK', 'RB', 'CB', 'LB', 'CM', 'CAM', 'CDM', 'RW', 'LW', 'ST'];

export default function FormationScreen() {
  const { teamId } = useLocalSearchParams();
  const [players, setPlayers] = useState([]);
  const [selectedFormation, setSelectedFormation] = useState('4-3-3');
  const [formation, setFormation] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get(`/teams/${teamId}/players`).then(r => setPlayers(r.data.data));
    api.get(`/teams/${teamId}/formation`).then(r => { if (r.data.data) { setFormation(r.data.data); setSelectedFormation(r.data.data.name); }});
  }, [teamId]);

  const save = async () => {
    setSaving(true);
    try {
      const { data } = await api.post(`/teams/${teamId}/formation`, { name: selectedFormation, positions: [] });
      setFormation(data.data);
    } finally { setSaving(false); }
  };

  return (
    <SafeAreaView className="flex-1">
      <ScrollView className="px-4">
        <STText className="text-white text-xl font-bold mt-4 mb-4">Formation</STText>
        <View className="flex-row flex-wrap gap-2 mb-6">
          {FORMATIONS.map(f => (
            <TouchableOpacity key={f} onPress={() => setSelectedFormation(f)}
              className={`px-4 py-2 rounded-full border ${selectedFormation === f ? 'bg-primary border-primary' : 'border-border bg-card'}`}>
              <STText className={selectedFormation === f ? 'text-dark font-bold' : 'text-white'}>{f}</STText>
            </TouchableOpacity>
          ))}
        </View>
        <FormationView formation={{ name: selectedFormation, positions: formation?.positions || [] }} players={players} />
        <Button title="Save Formation" onPress={save} loading={saving} className="mt-4 mb-8" />
      </ScrollView>
    </SafeAreaView>
  );
}
