import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import useThemeStore from '@/store/themeStore';
import useT from '@/hooks/useT';
import { Screen, Button, TextField } from '@/components/ui';
import useAuthStore from '../../store/authStore';
import SocialAuthIconButtons from '../../components/auth/SocialAuthIconButtons';
import AuthHeader, { AuthDivider } from '../../components/auth/AuthHeader';
import { checkBackendConnection } from '../../utils/healthCheck';
import {
  biometricPromptCopy,
  getBiometricCredentials,
  getBiometricEnabled,
  getSupportedBiometricKinds,
  isBiometricAvailable,
  saveBiometricCredentials,
  setBiometricEnabled,
  unlockSavedCredentials,
} from '../../services/biometricAuthService';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [biometricEnabled, setBiometricEnabledState] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricError, setBiometricError] = useState('');
  const [hasSavedLogin, setHasSavedLogin] = useState(false);
  const [bioCopy, setBioCopy] = useState(biometricPromptCopy([]));
  const [connectionStatus, setConnectionStatus] = useState(null);
  const { login, loading, error, clearError } = useAuthStore();
  const router = useRouter();
  const tokens = useThemeStore((s) => s.tokens);
  const t = useT();
  const autoPrompted = useRef(false);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      const [enabled, available, saved, kinds, connection] = await Promise.all([
        getBiometricEnabled(),
        isBiometricAvailable(),
        getBiometricCredentials(),
        getSupportedBiometricKinds(),
        checkBackendConnection(),
      ]);
      if (cancelled) return;
      setBiometricEnabledState(enabled);
      setBiometricAvailable(available);
      setHasSavedLogin(Boolean(saved));
      setBioCopy(biometricPromptCopy(kinds));
      setConnectionStatus(connection);
      if (saved?.identifier) setEmail(saved.identifier);
    }

    bootstrap();
    return () => {
      cancelled = true;
    };
  }, []);

  const signInWithSavedLogin = useCallback(async () => {
    setBiometricError('');
    clearError?.();
    const unlocked = await unlockSavedCredentials();
    if (!unlocked.success) {
      if (unlocked.reason === 'unavailable') {
        setBiometricError('Biometric authentication is unavailable on this device.');
      } else if (unlocked.reason === 'user_cancel' || unlocked.reason === 'app_cancel' || unlocked.reason === 'system_cancel') {
        setBiometricError('Biometric authentication was cancelled.');
      } else if (unlocked.reason !== 'none') {
        setBiometricError('Biometric authentication failed. Sign in with your password.');
      }
      return false;
    }
    const ok = await login(unlocked.credentials.identifier, unlocked.credentials.password);
    if (!ok) {
      setHasSavedLogin(false);
      setBiometricError('Saved login expired. Sign in with your password.');
      return false;
    }
    router.replace('/(tabs)/dashboard');
    return true;
  }, [clearError, login, router]);

  useEffect(() => {
    if (autoPrompted.current) return;
    if (!biometricEnabled || !biometricAvailable || !hasSavedLogin || loading) return;
    autoPrompted.current = true;
    signInWithSavedLogin();
  }, [biometricEnabled, biometricAvailable, hasSavedLogin, loading, signInWithSavedLogin]);

  const toggleBiometric = async () => {
    const next = !biometricEnabled;
    setBiometricEnabledState(next);
    await setBiometricEnabled(next);
    if (!next) setHasSavedLogin(false);
  };

  const handleSignIn = async () => {
    setBiometricError('');
    clearError?.();

    if (biometricEnabled && hasSavedLogin && !password) {
      await signInWithSavedLogin();
      return;
    }

    const identifier = email.trim();
    if (!identifier || !password) {
      useAuthStore.setState({ error: 'Email/gamer tag and password are required' });
      return;
    }

    const ok = await login(identifier, password);
    if (!ok) return;
    if (biometricEnabled) {
      await saveBiometricCredentials(identifier, password);
      setHasSavedLogin(true);
    }
    // Bootstrap still redirects unfinished profiles to onboarding.
    router.replace('/(tabs)/dashboard');
  };

  return (
    <Screen keyboardAvoiding tabBar={false}>
      <View style={{ flexGrow: 1, gap: 20 }}>
        <AuthHeader title="Welcome back" subtitle="Sign in to get back to your club." />

        <TextField
          label="Email or gamertag"
          value={email}
          onChangeText={(v) => {
            clearError?.();
            setEmail(v);
          }}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          placeholder="Email, gamertag, or club name"
        />

        <TextField
          label="Password"
          value={password}
          onChangeText={(v) => {
            clearError?.();
            setPassword(v);
          }}
          secureTextEntry={!showPassword}
          placeholder="Password"
          right={
            <Pressable
              onPress={() => setShowPassword((prev) => !prev)}
              accessibilityRole="button"
              accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}
            >
              <Ionicons
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={22}
                color={tokens.muted}
              />
            </Pressable>
          }
        />

        <Pressable
          onPress={() => router.push('/auth/forgotpassword')}
          accessibilityRole="link"
          accessibilityLabel={t('stage.forgot.link')}
          style={{ alignSelf: 'flex-end', minHeight: 44, justifyContent: 'center', marginTop: -12 }}
        >
          <Text style={{ color: tokens.cyan, fontSize: 13, fontWeight: '600' }}>{t('stage.forgot.link')}</Text>
        </Pressable>

        {error ? (
          <Text accessibilityRole="alert" style={{ color: tokens.danger, fontSize: 12, textAlign: 'center' }}>
            {error}
          </Text>
        ) : null}
        {biometricError ? (
          <Text accessibilityRole="alert" style={{ color: tokens.danger, fontSize: 12, textAlign: 'center' }}>
            {biometricError}
          </Text>
        ) : null}
        {connectionStatus && !connectionStatus.ok ? (
          <Text style={{ color: tokens.warning, fontSize: 12, textAlign: 'center' }}>
            {connectionStatus.message}
          </Text>
        ) : null}

        <Button
          title={loading ? 'Signing in…' : 'Sign in'}
          onPress={handleSignIn}
          loading={loading}
        />

        {biometricAvailable && biometricEnabled && hasSavedLogin ? (
          <Button
            title={bioCopy.buttonLabel}
            variant="secondary"
            icon={Platform.OS === 'ios' ? 'scan-outline' : 'finger-print'}
            onPress={signInWithSavedLogin}
            disabled={loading}
          />
        ) : null}

        {biometricAvailable ? (
          <Pressable
            onPress={toggleBiometric}
            accessibilityRole="switch"
            accessibilityLabel={bioCopy.settingsLabel}
            accessibilityState={{ checked: biometricEnabled }}
            style={{
              minHeight: 44,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
            }}
          >
            <Text style={{ flexShrink: 1, color: tokens.muted, fontSize: 13 }}>{bioCopy.settingsLabel}</Text>
            <Text
              style={{
                color: biometricEnabled ? tokens.success : tokens.muted,
                fontSize: 13,
                fontWeight: '600',
              }}
            >
              {biometricEnabled ? 'On' : 'Off'}
            </Text>
          </Pressable>
        ) : null}

        <AuthDivider label="or continue with" />
        <SocialAuthIconButtons />

        <Pressable
          onPress={() => router.push('/auth/signupscreen')}
          accessibilityRole="link"
          style={{ marginTop: 'auto', minHeight: 44, alignItems: 'center', justifyContent: 'center' }}
        >
          <Text style={{ color: tokens.muted, fontSize: 14, textAlign: 'center' }}>
            Don&apos;t have an account?{' '}
            <Text style={{ color: tokens.cyan, fontWeight: '600' }}>Sign up</Text>
          </Text>
        </Pressable>
      </View>
    </Screen>
  );
}
