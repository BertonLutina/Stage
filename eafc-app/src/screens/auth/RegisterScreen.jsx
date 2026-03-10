import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import useAuthStore from '../../store/authStore';

export default function RegisterScreen({ navigation }) {
  const [form, setForm] = useState({ first_name: '', last_name: '', email: '', password: '', gamer_tag: '', country: '' });
  const { register, loading, error } = useAuthStore();

  const set = (key) => (val) => setForm(f => ({ ...f, [key]: val }));

  return (
    <SafeAreaView className="flex-1 bg-dark">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
        <ScrollView className="px-6" showsVerticalScrollIndicator={false}>
          <View className="items-center mt-8 mb-6">
            <Text className="text-primary text-3xl font-black">EAFC</Text>
            <Text className="text-white text-xl font-bold mt-1">Create Account</Text>
          </View>

          {error ? (
            <View className="bg-danger/20 border border-danger rounded-xl p-3 mb-4">
              <Text className="text-danger text-sm">{error}</Text>
            </View>
          ) : null}

          <View className="flex-row gap-3">
            <View className="flex-1"><Input label="First name" value={form.first_name} onChangeText={set('first_name')} placeholder="John" /></View>
            <View className="flex-1"><Input label="Last name" value={form.last_name} onChangeText={set('last_name')} placeholder="Doe" /></View>
          </View>
          <Input label="Email" value={form.email} onChangeText={set('email')} keyboardType="email-address" autoCapitalize="none" placeholder="your@email.com" />
          <Input label="Password" value={form.password} onChangeText={set('password')} secureTextEntry placeholder="Min. 8 characters" />
          <Input label="Gamer Tag" value={form.gamer_tag} onChangeText={set('gamer_tag')} placeholder="Lutina_17" />
          <Input label="Country" value={form.country} onChangeText={set('country')} placeholder="Belgium" />

          <Button title="Create Account" onPress={() => register(form)} loading={loading} className="mt-2 mb-6" />

          <View className="flex-row justify-center mb-8">
            <Text className="text-muted">Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text className="text-primary font-bold">Sign in</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
