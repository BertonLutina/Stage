import React, { useState } from 'react';
import {
  View,
  Image,
  ImageBackground,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import STText from '../../components/common/STText';
import useAuthStore from '../../store/authStore';
import SocialAuthIconButtons from '../../components/auth/SocialAuthIconButtons';
import { SUPPORTED_LANGUAGES } from '../../lib/languages';
import { localStorage } from '../../lib/polyfillStorage';
import { DISCORD_INVITE_URL, isDiscordConfigured } from '../../lib/discordConfig';

const LOGIN_BANNER = require('../../../assets/Banner-mobile.jpg');
const STADIUM_LOGO = require('../../../assets/stadium-logo.png');
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export default function SignupScreen() {
  const router = useRouter();
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
    <ImageBackground source={LOGIN_BANNER} style={styles.background} resizeMode="cover">
      <View style={styles.scrim} pointerEvents="none" />
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.flex}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.card}>
              <View style={styles.brand}>
                <Image source={STADIUM_LOGO} style={styles.logo} resizeMode="contain" />
                <STText style={styles.subtitle}>Create account</STText>
              </View>

              <View style={styles.oauth}>
                <SocialAuthIconButtons mode="signup" />
              </View>

              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <STText style={styles.dividerText}>or</STText>
                <View style={styles.dividerLine} />
              </View>

              <View style={styles.form}>
                <TextInput
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
                  placeholderTextColor="rgba(255,255,255,0.35)"
                  style={styles.input}
                />

                <View style={styles.passwordWrap}>
                  <TextInput
                    value={password}
                    onChangeText={(v) => {
                      setLocalError('');
                      clearError?.();
                      setPassword(v);
                    }}
                    secureTextEntry={!showPassword}
                    placeholder="Password"
                    placeholderTextColor="rgba(255,255,255,0.35)"
                    style={[styles.input, styles.passwordInput]}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword((prev) => !prev)}
                    style={styles.eyeButton}
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  >
                    <Ionicons
                      name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={18}
                      color="rgba(255,255,255,0.45)"
                    />
                  </TouchableOpacity>
                </View>

                <View style={styles.passwordWrap}>
                  <TextInput
                    value={confirmPassword}
                    onChangeText={(v) => {
                      setLocalError('');
                      clearError?.();
                      setConfirmPassword(v);
                    }}
                    secureTextEntry={!showConfirmPassword}
                    placeholder="Confirm password"
                    placeholderTextColor="rgba(255,255,255,0.35)"
                    style={[styles.input, styles.passwordInput]}
                  />
                  <TouchableOpacity
                    onPress={() => setShowConfirmPassword((prev) => !prev)}
                    style={styles.eyeButton}
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  >
                    <Ionicons
                      name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={18}
                      color="rgba(255,255,255,0.45)"
                    />
                  </TouchableOpacity>
                </View>

                {displayError ? (
                  <STText style={styles.errorText}>{displayError}</STText>
                ) : null}

                <STText style={styles.langLabel}>Choose language</STText>
                <View style={styles.langRow}>
                  {SUPPORTED_LANGUAGES.map((item) => (
                    <TouchableOpacity
                      key={item.value}
                      onPress={() => setLanguage(item.value)}
                      style={[styles.langChip, language === item.value && styles.langChipActive]}
                    >
                      <STText style={[styles.langChipText, language === item.value && styles.langChipTextActive]}>
                        {item.flag} {item.nativeLabel}
                      </STText>
                    </TouchableOpacity>
                  ))}
                </View>

                <TouchableOpacity
                  onPress={handleSignup}
                  disabled={loading}
                  activeOpacity={0.85}
                  style={[styles.submit, loading && styles.submitDisabled]}
                >
                  {loading ? (
                    <View style={styles.submitLoading}>
                      <ActivityIndicator color="#0d2461" size="small" />
                      <STText style={styles.submitText}>Creating account…</STText>
                    </View>
                  ) : (
                    <STText style={styles.submitText}>Create account</STText>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => router.push('/auth/loginscreen')}
                  style={styles.switchMode}
                  activeOpacity={0.7}
                >
                  <STText style={styles.switchModeText}>Already have an account? Sign in</STText>
                </TouchableOpacity>

                {isDiscordConfigured() && DISCORD_INVITE_URL ? (
                  <View style={styles.discordBox}>
                    <STText style={styles.discordEyebrow}>After you sign up</STText>
                    <TouchableOpacity
                      onPress={() => Linking.openURL(DISCORD_INVITE_URL)}
                      style={styles.discordButton}
                      activeOpacity={0.85}
                    >
                      <STText style={styles.discordButtonText}>Join our Discord community</STText>
                    </TouchableOpacity>
                    <STText style={styles.discordHint}>
                      You can also join anytime from Community in the app
                    </STText>
                  </View>
                ) : null}
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#040e30',
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(2,9,27,0.22)',
  },
  safe: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  card: {
    width: '100%',
    maxWidth: 384,
    alignSelf: 'center',
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.20)',
    borderRadius: 16,
    padding: 32,
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 12,
  },
  brand: {
    alignItems: 'center',
    marginBottom: 28,
    gap: 8,
  },
  logo: {
    height: 96,
    width: 220,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.50)',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 4,
    textTransform: 'uppercase',
  },
  oauth: {
    marginBottom: 20,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.20)',
  },
  dividerText: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 11,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  form: {
    gap: 12,
  },
  input: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.20)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: '#FFFFFF',
    fontSize: 14,
  },
  passwordWrap: {
    position: 'relative',
    justifyContent: 'center',
  },
  passwordInput: {
    paddingRight: 44,
  },
  eyeButton: {
    position: 'absolute',
    right: 12,
    height: '100%',
    justifyContent: 'center',
  },
  errorText: {
    color: '#F87171',
    fontSize: 12,
    textAlign: 'center',
    paddingTop: 4,
  },
  langLabel: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 4,
  },
  langRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  },
  langChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  langChipActive: {
    borderColor: 'rgba(255,255,255,0.55)',
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  langChipText: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 11,
    fontWeight: '700',
  },
  langChipTextActive: {
    color: '#FFFFFF',
  },
  submit: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  submitDisabled: {
    opacity: 0.55,
  },
  submitLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  submitText: {
    color: '#0d2461',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  switchMode: {
    paddingTop: 4,
    alignItems: 'center',
  },
  switchModeText: {
    color: 'rgba(255,255,255,0.60)',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  discordBox: {
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.15)',
    gap: 8,
    alignItems: 'center',
  },
  discordEyebrow: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 10,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  discordButton: {
    width: '100%',
    backgroundColor: '#5865F2',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  discordButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  discordHint: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 10,
    textAlign: 'center',
  },
});
