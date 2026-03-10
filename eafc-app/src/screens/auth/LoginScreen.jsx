import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import useAuthStore from '../../store/authStore';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, loading, error } = useAuthStore();

  return (
    <SafeAreaView className="flex-1 bg-dark">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }} className="px-6">
          <View className="items-center mb-10">
            <Text className="text-primary text-4xl font-black tracking-wider">EAFC</Text>
            <Text className="text-white text-lg font-semibold mt-1">Tournament Platform</Text>
          </View>

          <Text className="text-white text-2xl font-bold mb-6">Welcome back</Text>

          {error ? (
            <View className="bg-danger/20 border border-danger rounded-xl p-3 mb-4">
              <Text className="text-danger text-sm">{error}</Text>
            </View>
          ) : null}

          <Input label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" placeholder="your@email.com" />
          <Input label="Password" value={password} onChangeText={setPassword} secureTextEntry placeholder="••••••••" />

          <Button title="Login" onPress={() => login(email, password)} loading={loading} className="mt-2" />

          <View className="flex-row items-center my-6">
            <View className="flex-1 h-px bg-border" />
            <Text className="text-muted mx-4 text-sm">or continue with</Text>
            <View className="flex-1 h-px bg-border" />
          </View>

          <Button title="Continue with Google" variant="ghost" onPress={() => {}} className="mb-3" />
          <Button title="Continue with Apple" variant="ghost" onPress={() => {}} />

          <View className="flex-row justify-center mt-8">
            <Text className="text-muted">Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text className="text-primary font-bold">Sign up</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
