import React, { useState } from 'react';
import { View, Text, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Input from '../../../components/common/Input';
import Button from '../../../components/common/Button';
import api from '../../../utils/api';
import useAuthStore from '../../../store/authStore';

export default function EditProfileScreen({ navigation }) {
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
      const { data } = await api.put(`/users/${user.id}`, form);
      updateUser(data.data);
      navigation.goBack();
    } finally { setLoading(false); }
  };

  return (
    <SafeAreaView className="flex-1 bg-dark">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
        <ScrollView className="px-6">
          <Text className="text-white text-2xl font-bold mt-6 mb-6">Edit Profile</Text>
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
  );
}
