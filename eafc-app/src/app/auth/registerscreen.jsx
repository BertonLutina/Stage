import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import useAuthStore from '../../store/authStore';

export default function RegisterScreen() {
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    gamer_tag: '',
    country: '',
  });
  const { register, loading, error } = useAuthStore();
  const router = useRouter();

  const set = (key) => (val) => setForm((f) => ({ ...f, [key]: val }));

  return (
    <LinearGradient
      colors={['#07163A', '#02a6a8', '#07163A']} // same gradient as Login
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
            className="px-6"
            contentContainerStyle={{ flexGrow: 1 }}
            showsVerticalScrollIndicator={false}
          >
            <View className="flex-1 justify-center">
              {/* Card */}
              <View className="border border-lineInner/30 rounded-3xl px-6 py-7">
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
                  Create account
                </Text>

                {error && (
                  <View className="bg-danger/15 border border-danger/60 rounded-2xl p-3 mb-3">
                    <Text className="text-danger text-xs">{error}</Text>
                  </View>
                )}

                {/* Form fields */}
                <View className="flex-row gap-3 mb-3">
                  <View className="flex-1">
                    <Input
                      label="First name"
                      value={form.first_name}
                      onChangeText={set('first_name')}
                      placeholder="John"
                    />
                  </View>
                  <View className="flex-1">
                    <Input
                      label="Last name"
                      value={form.last_name}
                      onChangeText={set('last_name')}
                      placeholder="Doe"
                    />
                  </View>
                </View>

                <View className="space-y-3 mb-2">
                  <Input
                    label="Email"
                    value={form.email}
                    onChangeText={set('email')}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    placeholder="you@example.com"
                  />
                  <Input
                    label="Password"
                    value={form.password}
                    onChangeText={set('password')}
                    secureTextEntry
                    placeholder="Min. 8 characters"
                  />
                  <Input
                    label="Gamer Tag"
                    value={form.gamer_tag}
                    onChangeText={set('gamer_tag')}
                    placeholder="Lutina_17"
                  />
                  <Input
                    label="Country"
                    value={form.country}
                    onChangeText={set('country')}
                    placeholder="Belgium"
                  />
                </View>

                <Button
                  title="Create account"
                  onPress={() => register(form)}
                  loading={loading}
                  className="mt-2 rounded-2xl py-3"
                />

                <View className="flex-row justify-center mt-6">
                  <Text className="text-white text-xs">
                    Already have an account?{' '}
                  </Text>
                  <TouchableOpacity onPress={() => router.push('/auth/loginscreen')}>
                    <Text className="text-primary font-semibold text-xs">
                      Sign in
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