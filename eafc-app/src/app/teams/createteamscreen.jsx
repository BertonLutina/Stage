import React, { useState } from 'react';
import { View, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity, Image, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import STText from '../../components/common/STText';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import useTeamStore from '../../store/teamStore';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import useColorSchemeColors from '../../hooks/useColorSchemeColors';
import BackButton from '../../components/common/BackButton';

export default function CreateTeamScreen({ navigation }) {
  const [form, setForm] = useState({ club_name: '', country: '', country_code: '', bio: '' });
  const [avatarUri, setAvatarUri] = useState(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { isDark } = useColorSchemeColors();
  const [error, setError] = useState(null);
  const { createTeam } = useTeamStore();
  const set = (k) => (v) => setForm(f => ({ ...f, [k]: v }));

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Photo library access is required for the team logo.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (!result.canceled && result.assets?.[0]?.uri) {
      setAvatarUri(result.assets[0].uri);
    }
  };

  const submit = async () => {
    if (!form.club_name) return setError('Club name is required');
    setLoading(true);
    try {
      const payload = { ...form };
      if (avatarUri && avatarUri.startsWith('file://')) {
        const ext = avatarUri.split('.').pop() || 'jpg';
        payload.avatar = {
          uri: avatarUri,
          type: ext === 'png' ? 'image/png' : 'image/jpeg',
          name: `avatar.${ext}`,
        };
      }
      const team = await createTeam(payload);
      navigation.replace('TeamProfile', { teamId: team.id });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create team');
    } finally { setLoading(false); }
  };

  return (
    <SafeAreaView className="flex-1">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
        <ScrollView className="px-6">
          <View className="flex-row items-center gap-6">
          <BackButton />
            <STText className="text-2xl font-bold mt-6 mb-6">Create Team</STText></View>
          {error && <View className="bg-danger/20 border border-danger rounded-xl p-3 mb-4"><STText className="text-danger">{error}</STText></View>}

          <TouchableOpacity onPress={pickImage} className="self-center mb-4">
            <View className="w-20 h-20 rounded-full border-2 border-[#5FE3E8] overflow-hidden bg-[#1A3566] items-center justify-center">
              {avatarUri ? (
                <Image source={{ uri: avatarUri }} className="w-full h-full" />
              ) : (
                <Ionicons name="shield" size={36} color="#5FE3E8" />
              )}
              <View className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-[#5FE3E8] items-center justify-center">
                <Ionicons name="camera" size={12} color="#0A1F4A" />
              </View>
            </View>
            <STText className="text-center text-xs mt-1 opacity-70">Team logo</STText>
          </TouchableOpacity>

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
