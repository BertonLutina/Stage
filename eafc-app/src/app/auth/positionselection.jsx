import React, { useState } from 'react';
import { View, TouchableOpacity } from 'react-native';
import STText from '../../components/common/STText';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Button from '../../components/common/Button';
import useAuthStore from '../../store/authStore';
import { updateIdentity } from '../../services/playerIdentityService';

const OPTIONS = ['GK', 'DEF', 'MID', 'ATT'];

export default function PositionSelectionScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [selected, setSelected] = useState('MID');

  const onNext = async () => {
    await updateIdentity(user?.id, { position: selected });
    router.push('/auth/clubsetup');
  };

  return (
    <SafeAreaView className="flex-1 px-6 justify-center">
      <View className="border border-lineInner/30 rounded-3xl px-6 py-7">
        <STText color="#FFFFFF" className="text-2xl font-bold mb-2">Position Selection</STText>
        <STText color="#FFFFFF" className="mb-4">Pick your preferred in-game position.</STText>
        <View className="gap-2">
          {OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt}
              onPress={() => setSelected(opt)}
              className={`rounded-2xl border px-4 py-3 ${selected === opt ? 'border-primary bg-primary/20' : 'border-lineInner/30'}`}
            >
              <STText className={selected === opt ? 'font-semibold' : ''} style={selected === opt ? { color: '#5FE3E8' } : { color: '#FFFFFF' }}>{opt}</STText>
            </TouchableOpacity>
          ))}
        </View>
        <Button title="Continue" onPress={onNext} className="mt-4 rounded-2xl py-3" />
      </View>
    </SafeAreaView>
  );
}
