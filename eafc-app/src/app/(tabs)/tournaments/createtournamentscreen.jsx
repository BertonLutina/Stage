import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Input from '../../../components/common/Input';
import Button from '../../../components/common/Button';
import useTournamentStore from '../../../store/tournamentStore';

const FORMATS = [
  { key: 'group_knockout', label: 'Group + Knockout', desc: '32 teams, group stage then knockout', icon: '🏆' },
  { key: 'single_elim', label: 'Single Elimination', desc: 'Max 64 teams, one loss = out', icon: '⚡' },
  { key: 'double_elim', label: 'Double Elimination', desc: 'Max 8 teams, need 2 losses', icon: '🔄' },
  { key: 'league_playoffs', label: 'League + Playoffs', desc: '36 teams, Swiss-style', icon: '📊' },
  { key: 'classic_league', label: 'Classic League', desc: '20 teams, round-robin', icon: '⚽' },
];

const MAX_TEAMS = { group_knockout: 32, single_elim: 64, double_elim: 8, league_playoffs: 36, classic_league: 20 };

export default function CreateTournamentScreen({ navigation }) {
  const [name, setName] = useState('');
  const [format, setFormat] = useState('single_elim');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const { create } = useTournamentStore();

  const submit = async () => {
    if (!name) return;
    setLoading(true);
    try {
      const t = await create({ name, format, max_teams: MAX_TEAMS[format], description });
      navigation.replace('TournamentDetail', { tournamentId: t.id });
    } finally { setLoading(false); }
  };

  return (
    <SafeAreaView className="flex-1 bg-dark">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
        <ScrollView className="px-6">
          <Text className="text-white text-2xl font-bold mt-6 mb-6">New Tournament</Text>
          <Input label="Tournament Name *" value={name} onChangeText={setName} placeholder="My Tournament" />
          <Input label="Description" value={description} onChangeText={setDescription} multiline numberOfLines={2} placeholder="Optional description..." />
          <Text className="text-white font-bold text-base mb-3">Format</Text>
          {FORMATS.map(f => (
            <TouchableOpacity key={f.key} onPress={() => setFormat(f.key)}
              className={`flex-row items-center p-4 rounded-2xl border mb-3 ${format === f.key ? 'bg-primary/10 border-primary' : 'bg-card border-border'}`}>
              <Text className="text-2xl mr-3">{f.icon}</Text>
              <View className="flex-1">
                <Text className={`font-bold ${format === f.key ? 'text-primary' : 'text-white'}`}>{f.label}</Text>
                <Text className="text-muted text-xs mt-0.5">{f.desc}</Text>
              </View>
              {format === f.key && <View className="w-5 h-5 rounded-full bg-primary items-center justify-center"><Text className="text-dark text-xs font-bold">✓</Text></View>}
            </TouchableOpacity>
          ))}
          <Button title="Create Tournament" onPress={submit} loading={loading} className="mt-2 mb-8" />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
