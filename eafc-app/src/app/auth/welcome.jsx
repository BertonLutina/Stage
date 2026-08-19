import React from 'react';
import { View, Image, TouchableOpacity } from 'react-native';
import STText from '../../components/common/STText';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 px-6">
      <View className="flex-1 items-center justify-center">
        <Image source={require('../../../assets/logo-lockup.png')} className="h-20 w-80" style={{ resizeMode: 'contain' }} />
        <STText color="#FFFFFF" className="text-center mt-3 px-4 opacity-80">
          Football and esports club platform. Build your identity, join clubs, and compete.
        </STText>
      </View>

      <View className="pb-8 gap-3">
        <TouchableOpacity onPress={() => router.push('/auth/signupscreen')} className="bg-primary rounded-2xl py-4 items-center">
          <STText className="font-bold" style={{ color: '#02091B' }}>Create Account</STText>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push('/auth/loginscreen')} className="border border-lineInner/40 rounded-2xl py-4 items-center">
          <STText color="#5FE3E8" className="font-semibold">I already have an account</STText>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
