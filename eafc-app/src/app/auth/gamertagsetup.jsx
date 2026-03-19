import React, { useState } from 'react';
import { View } from 'react-native';
import STText from '../../components/common/STText';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import useAuthStore from '../../store/authStore';
import api from '../../utils/api';
import { updateIdentity } from '../../services/playerIdentityService';

export default function GamertagSetupScreen() {
  const router = useRouter();
  const { user, updateUser } = useAuthStore();
  const [gamerTag, setGamerTag] = useState(user?.gamer_tag || '');
  const [loading, setLoading] = useState(false);

  const onNext = async () => {
    setLoading(true);
    try {
      const { data } = await api.put('/users/me', { gamer_tag: gamerTag });
      updateUser(data.data);
      await updateIdentity(user?.id, { gamer_tag: gamerTag });
      router.push('/auth/platformselection');
    } catch {
      router.push('/auth/platformselection');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 px-6 justify-center">
      <View className="border border-lineInner/30 rounded-3xl px-6 py-7">
        <STText className="text-2xl font-bold mb-2">Gamertag Setup</STText>
        <STText className="mb-4 opacity-80">Choose your identity name for STAGE.</STText>
        <Input label="Gamertag" value={gamerTag} onChangeText={setGamerTag} placeholder="Lutina_17" />
        <Button title="Continue" onPress={onNext} loading={loading} className="mt-4 rounded-2xl py-3" />
      </View>
    </SafeAreaView>
  );
}
