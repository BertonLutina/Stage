import React, { useCallback, useEffect, useRef, useState } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import STText from '../../components/common/STText';
import useAuthStore from '../../store/authStore';
import SocialAuthIconButtons from '../../components/auth/SocialAuthIconButtons';
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

const LOGIN_BANNER = require('../../../assets/Banner-mobile.jpg');
const STADIUM_LOGO = require('../../../assets/stadium-logo.png');

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
    return true;
  }, [clearError, login]);

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
    if (ok && biometricEnabled) {
      await saveBiometricCredentials(identifier, password);
      setHasSavedLogin(true);
    }
  };

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
            <BlurView
              intensity={92}
              tint="systemUltraThinMaterialDark"
              experimentalBlurMethod="dimezisBlurView"
              style={styles.card}
            >
              <View style={styles.brand}>
                <Image source={STADIUM_LOGO} style={styles.logo} resizeMode="contain" />
                <STText style={styles.subtitle}>Welcome back</STText>
              </View>

              <View style={styles.oauth}>
                <SocialAuthIconButtons />
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
                    clearError?.();
                    setEmail(v);
                  }}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  placeholder="Email, gamertag, or club name"
                  placeholderTextColor="rgba(255,255,255,0.35)"
                  style={styles.input}
                />

                <View style={styles.passwordWrap}>
                  <TextInput
                    value={password}
                    onChangeText={(v) => {
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

                {error ? (
                  <STText style={styles.errorText}>{error}</STText>
                ) : null}
                {biometricError ? (
                  <STText style={styles.errorText}>{biometricError}</STText>
                ) : null}
                {connectionStatus && !connectionStatus.ok ? (
                  <STText style={styles.warnText}>{connectionStatus.message}</STText>
                ) : null}

                <TouchableOpacity
                  onPress={handleSignIn}
                  disabled={loading}
                  activeOpacity={0.85}
                  style={[styles.submit, loading && styles.submitDisabled]}
                >
                  {loading ? (
                    <View style={styles.submitLoading}>
                      <ActivityIndicator color="#0d2461" size="small" />
                      <STText style={styles.submitText}>Signing in…</STText>
                    </View>
                  ) : (
                    <STText style={styles.submitText}>Sign in</STText>
                  )}
                </TouchableOpacity>

                {biometricAvailable && biometricEnabled && hasSavedLogin ? (
                  <TouchableOpacity
                    onPress={signInWithSavedLogin}
                    disabled={loading}
                    activeOpacity={0.85}
                    style={styles.bioSignIn}
                  >
                    <Ionicons
                      name={Platform.OS === 'ios' ? 'scan-outline' : 'finger-print'}
                      size={18}
                      color="#FFFFFF"
                    />
                    <STText style={styles.bioSignInText}>{bioCopy.buttonLabel}</STText>
                  </TouchableOpacity>
                ) : null}

                {biometricAvailable ? (
                  <TouchableOpacity onPress={toggleBiometric} style={styles.bioRow} activeOpacity={0.7}>
                    <STText style={styles.bioLabel}>{bioCopy.settingsLabel}</STText>
                    <STText style={[styles.bioValue, biometricEnabled && styles.bioOn]}>
                      {biometricEnabled ? 'On' : 'Off'}
                    </STText>
                  </TouchableOpacity>
                ) : null}

                <TouchableOpacity
                  onPress={() => router.push('/auth/signupscreen')}
                  style={styles.switchMode}
                  activeOpacity={0.7}
                >
                  <STText style={styles.switchModeText}>Don&apos;t have an account? Sign up</STText>
                </TouchableOpacity>
              </View>
            </BlurView>
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
    overflow: 'hidden',
    backgroundColor: 'rgba(4, 14, 48, 0.22)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
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
  warnText: {
    color: '#F59E0B',
    fontSize: 11,
    textAlign: 'center',
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
  bioSignIn: {
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  bioSignInText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  bioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  bioLabel: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 12,
  },
  bioValue: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 12,
    fontWeight: '600',
  },
  bioOn: {
    color: '#22C55E',
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
});
