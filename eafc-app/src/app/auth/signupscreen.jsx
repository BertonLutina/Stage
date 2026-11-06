import React, { useState } from 'react';
import { View, Text, Pressable, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import useThemeStore from '@/store/themeStore';
import { BRAND_COLORS } from '@/lib/brandColors';
import { Screen, Button, TextField } from '@/components/ui';
import useAuthStore from '../../store/authStore';
import SocialAuthIconButtons from '../../components/auth/SocialAuthIconButtons';
import AuthHeader, { AuthDivider } from '../../components/auth/AuthHeader';
import { SettingsListbox } from '../../components/settings/SettingsListbox';
import { DISPLAY_LANGUAGES } from '../../lib/languages';
import { localStorage } from '../../lib/polyfillStorage';
import { DISCORD_INVITE_URL, isDiscordConfigured } from '../../lib/discordConfig';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export default function SignupScreen() {
  const router = useRouter();
  const tokens = useThemeStore((s) => s.tokens);
  const { register, loading, error, clearError } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [language, setLanguage] = useState(() => localStorage.getItem('language') || 'en');
  const [localError, setLocalError] = useState('');

  const setFieldError = (message) => {
    setLocalError(message);
    clearError?.();
  };

  const handleSignup = async () => {
    setLocalError('');
    clearError?.();
    const trimmed = email.trim();
    if (!EMAIL_REGEX.test(trimmed)) {
      setFieldError('Please enter a valid email address.');
      return;
    }
    if (!password) {
      setFieldError('Password is required');
      return;
    }
    if (password !== confirmPassword) {
      setFieldError('Passwords do not match.');
      return;
    }
    localStorage.setItem('language', language);
    const ok = await register({ email: trimmed, password });
    if (ok) router.replace('/auth/onboarding');
  };

  const displayError = localError || error;

  return (
    <Screen keyboardAvoiding tabBar={false}>
      <View style={{ flexGrow: 1, gap: 18 }}>
        <AuthHeader title="Create account" subtitle="Join Stage as a player or club manager." />

        <TextField
          label="Email"
          value={email}
          onChangeText={(v) => {
            setLocalError('');
            clearError?.();
            setEmail(v);
          }}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          placeholder="Email address"
        />

        <TextField
          label="Password"
          value={password}
          onChangeText={(v) => {
            setLocalError('');
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

        <TextField
          label="Confirm password"
          value={confirmPassword}
          onChangeText={(v) => {
            setLocalError('');
            clearError?.();
            setConfirmPassword(v);
          }}
          secureTextEntry={!showConfirmPassword}
          placeholder="Confirm password"
          right={
            <Pressable
              onPress={() => setShowConfirmPassword((prev) => !prev)}
              accessibilityRole="button"
              accessibilityLabel={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}
            >
              <Ionicons
                name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                size={22}
                color={tokens.muted}
              />
            </Pressable>
          }
        />

        {displayError ? (
          <Text accessibilityRole="alert" style={{ color: tokens.danger, fontSize: 12, textAlign: 'center' }}>
            {displayError}
          </Text>
        ) : null}

        <SettingsListbox
          label="Choose language"
          value={language}
          title="Language"
          searchPlaceholder="Search…"
          options={DISPLAY_LANGUAGES.map((item) => ({
            id: item.value,
            label: `${item.flag} ${item.nativeLabel}`,
            description: item.label,
            disabled: !item.enabled,
          }))}
          onChange={(id) => setLanguage(id)}
        />

        <Button
          title={loading ? 'Creating account…' : 'Create account'}
          onPress={handleSignup}
          loading={loading}
        />

        <AuthDivider label="or continue with" />
        <SocialAuthIconButtons mode="signup" />

        {isDiscordConfigured() && DISCORD_INVITE_URL ? (
          <View
            style={{
              marginTop: 4,
              paddingTop: 16,
              borderTopWidth: 1,
              borderTopColor: tokens.border,
              gap: 8,
              alignItems: 'center',
            }}
          >
            <Text
              style={{
                color: tokens.muted,
                fontSize: 11,
                fontWeight: '600',
                letterSpacing: 11 * 0.12,
                textTransform: 'uppercase',
              }}
            >
              After you sign up
            </Text>
            <Pressable
              onPress={() => Linking.openURL(DISCORD_INVITE_URL)}
              accessibilityRole="button"
              style={{
                alignSelf: 'stretch',
                height: 52,
                borderRadius: 14,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: BRAND_COLORS.discord,
              }}
            >
              <Text style={{ color: tokens.text, fontSize: 15, fontWeight: '600' }}>
                Join our Discord community
              </Text>
            </Pressable>
            <Text style={{ color: tokens.muted, fontSize: 12, textAlign: 'center' }}>
              You can also join anytime from Community in the app
            </Text>
          </View>
        ) : null}

        <Pressable
          onPress={() => router.push('/auth/loginscreen')}
          accessibilityRole="link"
          style={{ marginTop: 'auto', minHeight: 44, alignItems: 'center', justifyContent: 'center' }}
        >
          <Text style={{ color: tokens.muted, fontSize: 14, textAlign: 'center' }}>
            Already have an account?{' '}
            <Text style={{ color: tokens.cyan, fontWeight: '600' }}>Sign in</Text>
          </Text>
        </Pressable>
      </View>
    </Screen>
  );
}
