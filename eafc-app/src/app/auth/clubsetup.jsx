import React, { useState } from 'react';
import { View, TouchableOpacity } from 'react-native';
import STText from '../../components/common/STText';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Button from '../../components/common/Button';
import useAuthStore from '../../store/authStore';
import { updateIdentity } from '../../services/playerIdentityService';

export default function ClubSetupScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [choice, setChoice] = useState('freeagent');

  const onFinish = async () => {
    await updateIdentity(user?.id, {
      clubChoice: choice,
      onboardingComplete: true,
    });
    if (choice === 'create') {
      router.replace('/teams/createteamscreen');
      return;
    }
    router.replace('/(tabs)/dashboard');
  };

  return (
    <SafeAreaView className="flex-1 px-6 justify-center">
      <View className="border border-lineInner/30 rounded-3xl px-6 py-7">
        <STText color="#FFFFFF" className="text-2xl font-bold mb-2">Club or free agent</STText>
        <STText color="#FFFFFF" className="mb-4 opacity-80">Found a club, or wait for a contract offer. Clubs sign players — you don’t browse to join.</STText>

        <TouchableOpacity
          onPress={() => setChoice('create')}
          className={`rounded-2xl border px-4 py-3 mb-2 ${choice === 'create' ? 'border-primary bg-primary/20' : 'border-lineInner/30'}`}
        >
          <STText className={choice === 'create' ? 'font-semibold' : ''} style={choice === 'create' ? { color: '#5FE3E8' } : { color: '#FFFFFF' }}>Create Club</STText>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setChoice('freeagent')}
          className={`rounded-2xl border px-4 py-3 ${choice === 'freeagent' ? 'border-primary bg-primary/20' : 'border-lineInner/30'}`}
        >
          <STText className={choice === 'freeagent' ? 'font-semibold' : ''} style={choice === 'freeagent' ? { color: '#5FE3E8' } : { color: '#FFFFFF' }}>Free Agent</STText>
        </TouchableOpacity>

        <Button title="Finish Setup" onPress={onFinish} className="mt-4 rounded-2xl py-3" />
      </View>
    </SafeAreaView>
  );
}
