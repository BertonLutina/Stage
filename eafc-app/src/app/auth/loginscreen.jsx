import React, { useEffect, useState } from 'react';
import { View, Image, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import STText from '../../components/common/STText';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import useAuthStore from '../../store/authStore';
import api from '../../utils/api';
import SocialAuthIconButtons from '../../components/auth/SocialAuthIconButtons';
import { checkBackendConnection } from '../../utils/healthCheck';
import {
  authenticateForLogin,
  getBiometricEnabled,
  isBiometricAvailable,
  resolveSigninPreference,
  setBiometricEnabled,
} from '../../services/biometricAuthService';

export default function LoginScreen() {
  const [email, setEmail] = useState('lengarose');
  const [password, setPassword] = useState('Stage2025!');
  const [showPassword, setShowPassword] = useState(false);
  const [biometricEnabled, setBiometricEnabledState] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricError, setBiometricError] = useState('');
  const [connectionStatus, setConnectionStatus] = useState(null);
  const { login, loading, error } = useAuthStore();

  const testConnection = async () => {
    setConnectionStatus(null);
    const result = await checkBackendConnection();
    setConnectionStatus(result);
  };
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;

    async function bootstrapBiometric() {
      const [enabled, available] = await Promise.all([
        getBiometricEnabled(),
        isBiometricAvailable(),
      ]);
      if (!cancelled) {
        setBiometricEnabledState(enabled);
        setBiometricAvailable(available);
      }
    }

    bootstrapBiometric();
    return () => {
      cancelled = true;
    };
  }, []);

  const toggleBiometric = async () => {
    const next = !biometricEnabled;
    setBiometricEnabledState(next);
    await setBiometricEnabled(next);
  };

  const handleSignIn = async () => {
    setBiometricError('');

    if (biometricEnabled) {
      const bio = await authenticateForLogin();
      if (!bio.success) {
        if (bio.reason === 'unavailable') {
          setBiometricError('Biometric authentication is unavailable on this device.');
        } else if (bio.reason === 'user_cancel' || bio.reason === 'app_cancel' || bio.reason === 'system_cancel') {
          setBiometricError('Biometric authentication was cancelled.');
          return;
        } else {
          setBiometricError('Biometric authentication failed. You can try again or use password.');
          return;
        }
      }
    }

    await login(email, password);
    try {
      const signinPreference = await resolveSigninPreference(biometricEnabled);
      await api.put('/users/me', { signin_preference: signinPreference });
    } catch {
      // Non-blocking: login flow should not fail if preference update fails.
    }
  };

  return (
      <SafeAreaView className="flex-1">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
        >
          <ScrollView
            contentContainerStyle={{ flexGrow: 1 }}
            className="px-6"
          >
            <View className="flex-1">
              <View className="items-center w-full mb-6 absolute top-0">
                  <Image
                    source={require('../../../assets/logo.png')}
                    className="h-64 w-64"
                    style={{ resizeMode: 'contain' }}
                  />
                </View>
              <View className="relative top-56 border border-lineInner/30 rounded-3xl px-6 py-7">

                <STText color="#FFFFFF" className="text-xl font-semibold mb-4">
                  Welcome back
                </STText>

                {error && (
                  <View className="bg-danger/15 border border-danger/60 rounded-2xl p-3 mb-3">
                    <STText className="text-xs" style={{ color: '#EF4444' }}>{error}</STText>
                  </View>
                )}
                {biometricError ? (
                  <View className="bg-accent/15 border border-accent/60 rounded-2xl p-3 mb-3">
                    <STText className="text-xs" style={{ color: '#8CF5F8' }}>{biometricError}</STText>
                  </View>
                ) : null}
                {connectionStatus && (
                  <View className={`rounded-2xl p-3 mb-3 border ${connectionStatus.ok ? 'bg-green-500/15 border-green-500/60' : 'bg-amber-500/15 border-amber-500/60'}`}>
                    <STText className="text-xs" style={{ color: connectionStatus.ok ? '#22C55E' : '#F59E0B' }}>
                      {connectionStatus.ok ? '✓ ' : ''}{connectionStatus.message}
                    </STText>
                  </View>
                )}

                <View className="space-y-4 mb-2">
                  <Input
                    color="#FFFFFF"
                    label="Email or gamer tag"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    placeholder="you@example.com or gamer_tag"
                  />

                  <Input
                    color="#FFFFFF"
                    label="Password"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    onTogglePassword={() => setShowPassword((prev) => !prev)}
                    placeholder="••••••••"
                  />
                </View>

                {biometricAvailable ? (
                  <TouchableOpacity
                    onPress={toggleBiometric}
                    className="flex-row items-center justify-between bg-darkCard/50 border border-lineInner/30 rounded-2xl px-4 py-3 mt-2"
                  >
                    <STText color="#5FE3E8" className="text-sm">Enable biometric login</STText>
                    <STText color="#5FE3E8" className={biometricEnabled ? 'font-semibold' : 'opacity-70'} style={biometricEnabled ? { color: '#22C55E' } : undefined}>
                      {biometricEnabled ? 'On' : 'Off'}
                    </STText>
                  </TouchableOpacity>
                ) : (
                  <STText color="#FFFFFF" className="text-xs mt-2 opacity-70">Biometric authentication not available on this device.</STText>
                )}

                <TouchableOpacity onPress={testConnection} className="self-end mb-2">
                  <STText className="text-xs" style={{ color: '#5FE3E8' }}>Test backend connection</STText>
                </TouchableOpacity>
                <Button
                  title={biometricEnabled ? 'Sign in with biometrics' : 'Sign in'}
                  variant={biometricEnabled ? 'secondary' : 'primary2'}
                  onPress={handleSignIn}
                  loading={loading}
                  className="mt-2 rounded-2xl py-3"
                />

                <View className="flex-row items-center my-5">
                  <View className="flex-1 h-px bg-lineInner/30" />
                  <STText color="#FFFFFF" className="mx-3 text-xs">
                    or continue with
                  </STText>
                  <View className="flex-1 h-px bg-lineInner/30" />
                </View>

                <SocialAuthIconButtons />

                <View className="flex-row justify-center mt-6">
                  <STText color="#FFFFFF" className="text-xs">
                    Don&apos;t have an account?{' '}
                  </STText>
                  <TouchableOpacity onPress={() => router.push('/auth/signupscreen')}>
                    <STText className="font-semibold text-xs" style={{ color: '#5FE3E8' }}>
                      Create one
                    </STText>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
  );
}