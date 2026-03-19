import React, { useState } from 'react';
import { View, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import STText from '../../../components/common/STText';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Input from '../../../components/common/Input';
import Button from '../../../components/common/Button';
import api from '../../../utils/api';
import useAuthStore from '../../../store/authStore';
import GradientBackground from '../../../components/common/GradientBackground';

export default function EditProfileScreen() {
  const router = useRouter();
  const { user, updateUser } = useAuthStore();
  const [form, setForm] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    gamer_tag: user?.gamer_tag || '',
    country: user?.country || '',
    country_code: user?.country_code || '',
    phone_number: user?.phone_number || '',
    bio: user?.bio || '',
  });
  const [loading, setLoading] = useState(false);
  const set = (k) => (v) => setForm(f => ({ ...f, [k]: v }));

  const save = async () => {
    setLoading(true);
    try {
      const { data } = await api.put('/users/me', form);
      updateUser(data.data);
      router.back();
    } finally { setLoading(false); }
  };

  return (
    <View className="flex-1">
    <SafeAreaView className="flex-1">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
        <ScrollView className="px-6">
          <STText className="text-2xl font-bold mt-6 mb-6">Edit Profile</STText>
          <View className="flex-row gap-3">
            <View className="flex-1"><Input label="First name" value={form.first_name} onChangeText={set('first_name')} /></View>
            <View className="flex-1"><Input label="Last name" value={form.last_name} onChangeText={set('last_name')} /></View>
          </View>
          <Input label="Gamer Tag" value={form.gamer_tag} onChangeText={set('gamer_tag')} placeholder="Lutina_17" />
          <Input label="Country" value={form.country} onChangeText={set('country')} />
          <Input label="Country Code" value={form.country_code} onChangeText={set('country_code')} autoCapitalize="characters" />
          <Input label="Phone" value={form.phone_number} onChangeText={set('phone_number')} keyboardType="phone-pad" />
          <Input label="Bio" value={form.bio} onChangeText={set('bio')} multiline numberOfLines={3} placeholder="Tell us about yourself..." />
          <Button title="Save Changes" onPress={save} loading={loading} className="mt-2 mb-8" />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
    </View>
  );
}
