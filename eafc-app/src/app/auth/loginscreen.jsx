import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { LinearGradient } from 'expo-linear-gradient';

import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import useAuthStore from '../../store/authStore';



export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, loading, error } = useAuthStore();
  const router = useRouter();


  return (
    <LinearGradient
      colors={['#07163A','#02a6a8','#07163A']} // primary → green → accent
      start={{ x: 1, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ flex: 1 }}
    >
      <SafeAreaView className="flex-1">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
        >
          <ScrollView
            contentContainerStyle={{ flexGrow: 1 }}
            className="px-6"
          >
            <View className="flex-1 justify-center">
              <View className=" border border-lineInner/30 rounded-3xl px-6 py-7">
                {/* Brand */}
                <View className="items-center mb-6">
                  <Text className="text-white text-3xl font-black tracking-[0.25em] uppercase">
                    STAGE
                  </Text>
                  <Text className="text-white text-xs mt-1">
                    Competitive Football Tournaments
                  </Text>
                  <View className="mt-4 w-24 h-1 rounded-full" />
                </View>

                <Text className="text-white text-xl font-semibold mb-4">
                  Welcome back
                </Text>

                {error && (
                  <View className="bg-danger/15 border border-danger/60 rounded-2xl p-3 mb-3">
                    <Text className="text-danger text-xs">{error}</Text>
                  </View>
                )}

                <View className="space-y-4 mb-2">
                  <Input
                    label="Email"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    placeholder="you@example.com"
                  />
                  <Input
                    label="Password"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    placeholder="••••••••"
                  />
                </View>

                <Button
                  title="Sign in"
                  onPress={() => login(email, password)}
                  loading={loading}
                  className="mt-2 rounded-2xl py-3"
                />

                <View className="flex-row items-center my-5">
                  <View className="flex-1 h-px bg-lineInner/30" />
                  <Text className="text-white mx-3 text-xs">
                    or continue with
                  </Text>
                  <View className="flex-1 h-px bg-lineInner/30" />
                </View>

                <Button
                  title="Continue with Google"
                  variant="ghost"
                  onPress={() => {}}
                  className="mb-2 border border-lineInner/40 bg-darkCard/60 rounded-2xl"
                />
                <Button
                  title="Continue with Apple"
                  variant="ghost"
                  onPress={() => {}}
                  className="border border-lineInner/40 bg-darkCard/60 rounded-2xl"
                />

                <View className="flex-row justify-center mt-6">
                  <Text className="text-white text-xs">
                    Don&apos;t have an account?{' '}
                  </Text>
                  <TouchableOpacity onPress={() => router.push('/auth/registerscreen')}>
                    <Text className="text-primary font-semibold text-xs">
                      Create one
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}