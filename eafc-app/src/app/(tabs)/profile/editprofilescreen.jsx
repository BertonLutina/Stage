import React, { useState } from 'react';
import { View, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity, Image, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import STText from '../../../components/common/STText';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Input from '../../../components/common/Input';
import Button from '../../../components/common/Button';
import api from '../../../utils/api';
import useAuthStore from '../../../store/authStore';
import GradientBackground from '../../../components/common/GradientBackground';
import BackButton from '../../../components/common/BackButton';

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
  const [avatarUri, setAvatarUri] = useState(null);
  const [loading, setLoading] = useState(false);
  const set = (k) => (v) => setForm(f => ({ ...f, [k]: v }));

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Photo library access is required to change your avatar.');
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

  const save = async () => {
    setLoading(true);
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([k, v]) => { if (v != null && v !== '') formData.append(k, v); });
      if (avatarUri && avatarUri.startsWith('file://')) {
        const ext = avatarUri.split('.').pop() || 'jpg';
        formData.append('avatar', {
          uri: avatarUri,
          type: ext === 'png' ? 'image/png' : 'image/jpeg',
          name: `avatar.${ext}`,
        });
      }
      const { data } = await api.put('/users/me', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      updateUser(data.data);
      router.back();
    } finally { setLoading(false); }
  };

  const displayUri = avatarUri
    ? avatarUri
    : (user?.avatar ? (user.avatar.startsWith('http') ? user.avatar : `${api.defaults.baseURL}${user.avatar}`) : null);

  return (
    <View className="flex-1">
    <SafeAreaView className="flex-1">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
        <ScrollView className="px-6">
          <View className="flex-row items-center gap-4 mt-2 mb-4">
            <BackButton />
            <STText className="text-2xl font-bold flex-1">Edit Profile</STText>
          </View>

          <TouchableOpacity onPress={pickImage} className="self-center mb-6">
            <View className="w-24 h-24 rounded-full border-2 border-[#5FE3E8] overflow-hidden bg-[#1A3566] items-center justify-center">
              {displayUri ? (
                <Image source={{ uri: displayUri }} className="w-full h-full" />
              ) : (
                <Ionicons name="person" size={48} color="#5FE3E8" />
              )}
              <View className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-[#5FE3E8] items-center justify-center">
                <Ionicons name="camera" size={14} color="#0A1F4A" />
              </View>
            </View>
            <STText className="text-center text-sm mt-2 opacity-70">Tap to change photo</STText>
          </TouchableOpacity>

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
