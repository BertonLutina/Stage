import React, { useState } from 'react';
import { View, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import STText from '../../components/common/STText';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import useAuthStore from '../../store/authStore';
import SocialAuthIconButtons from '../../components/auth/SocialAuthIconButtons';

export default function SignupScreen() {
  const router = useRouter();
  const { register, loading, error } = useAuthStore();
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    gamer_tag: '',
    country: '',
  });
  const [showPassword, setShowPassword] = useState(false);

  const set = (key) => (val) => setForm((f) => ({ ...f, [key]: val }));

  const handleSignup = async () => {
    await register(form);
    const authState = useAuthStore.getState();
    if (authState.user) router.replace('/auth/gamertagsetup');
  };

  return (
    <SafeAreaView className="flex-1">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
        <ScrollView className="px-6" contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
          <View className="flex-1 justify-center">
            <View className="border border-lineInner/30 rounded-3xl px-6 py-7">
              <STText color="#FFFFFF" className="text-xl font-semibold mb-4">Sign Up</STText>
              {error ? (
                <View className="bg-danger/15 border border-danger/60 rounded-2xl p-3 mb-3">
                  <STText className="text-xs" style={{ color: '#EF4444' }}>{error}</STText>
                </View>
              ) : null}

              <View className="flex-row gap-3 mb-3">
                <View className="flex-1"><Input label="First name" value={form.first_name} onChangeText={set('first_name')} placeholder="" /></View>
                <View className="flex-1"><Input label="Last name" value={form.last_name} onChangeText={set('last_name')} placeholder="" /></View>
              </View>
              <Input label="Email" value={form.email} onChangeText={set('email')} keyboardType="email-address" autoCapitalize="none" />
              <Input
                label="Password"
                value={form.password}
                onChangeText={set('password')}
                secureTextEntry={!showPassword}
                onTogglePassword={() => setShowPassword((prev) => !prev)}
              />

              <View className="flex-row items-center my-4">
                <View className="flex-1 h-px bg-lineInner/30" />
                <STText className="mx-3 text-xs">or sign up with</STText>
                <View className="flex-1 h-px bg-lineInner/30" />
              </View>
              <SocialAuthIconButtons mode="signup" />

              <Button variant="primary2" title="Create account" onPress={handleSignup} loading={loading} className="mt-2 rounded-2xl py-3" />
              <TouchableOpacity onPress={() => router.push('/auth/loginscreen')} className="mt-5 items-center">
                <STText className="text-xs opacity-80">Already have an account? <STText className="text-primary font-semibold" style={{ color: '#5FE3E8' }}>Sign in</STText></STText>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
