import React, { useState } from 'react';
import { View, Text, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Input from '../../../components/common/Input';
import Button from '../../../components/common/Button';
import useTeamStore from '../../../store/teamStore';

export default function CreateTeamScreen({ navigation }) {
  const [form, setForm] = useState({ club_name: '', country: '', country_code: '', bio: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { createTeam } = useTeamStore();
  const set = (k) => (v) => setForm(f => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.club_name) return setError('Club name is required');
    setLoading(true);
    try {
      const team = await createTeam(form);
      navigation.replace('TeamProfile', { teamId: team.id });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create team');
    } finally { setLoading(false); }
  };

  return (
    <SafeAreaView className="flex-1 bg-dark">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
        <ScrollView className="px-6">
          <Text className="text-white text-2xl font-bold mt-6 mb-6">Create Team</Text>
          {error && <View className="bg-danger/20 border border-danger rounded-xl p-3 mb-4"><Text className="text-danger">{error}</Text></View>}
          <Input label="Club Name *" value={form.club_name} onChangeText={set('club_name')} placeholder="FC Longue Vie" />
          <Input label="Country" value={form.country} onChangeText={set('country')} placeholder="Belgium" />
          <Input label="Country Code" value={form.country_code} onChangeText={set('country_code')} placeholder="BE" autoCapitalize="characters" />
          <Input label="Bio" value={form.bio} onChangeText={set('bio')} placeholder="About your team..." multiline numberOfLines={3} />
          <Button title="Create Team" onPress={submit} loading={loading} className="mt-2 mb-8" />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
