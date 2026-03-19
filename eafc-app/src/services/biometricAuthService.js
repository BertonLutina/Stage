import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuthentication from 'expo-local-authentication';
import { Platform } from 'react-native';

const BIOMETRIC_ENABLED_KEY = '@stage_biometric_enabled';

export async function getBiometricEnabled() {
  try {
    const value = await AsyncStorage.getItem(BIOMETRIC_ENABLED_KEY);
    return value === 'true';
  } catch {
    return false;
  }
}

export async function setBiometricEnabled(enabled) {
  try {
    await AsyncStorage.setItem(BIOMETRIC_ENABLED_KEY, enabled ? 'true' : 'false');
  } catch {
    // Non-blocking preference write.
  }
}

export async function isBiometricAvailable() {
  try {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    if (!hasHardware) return false;
    return LocalAuthentication.isEnrolledAsync();
  } catch {
    return false;
  }
}

export async function authenticateForLogin() {
  const available = await isBiometricAvailable();
  if (!available) {
    return { success: false, reason: 'unavailable' };
  }

  try {
    let promptMessage = 'Sign in with biometrics';
    if (Platform.OS === 'ios') {
      const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
      if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
        promptMessage = 'Use Face ID to sign in';
      } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
        promptMessage = 'Use Touch ID to sign in';
      }
    }

    // Keep device fallback enabled so iOS/Android passcode/pin can be used.
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage,
      cancelLabel: 'Cancel',
      disableDeviceFallback: false,
      fallbackLabel: Platform.OS === 'ios' ? 'Use Passcode' : undefined,
    });

    if (result.success) return { success: true };
    return { success: false, reason: result.error || 'failed' };
  } catch (error) {
    return { success: false, reason: 'error', error };
  }
}

export async function resolveSigninPreference(biometricEnabled) {
  if (!biometricEnabled) return 'normal';
  if (Platform.OS !== 'ios') return 'biometric';

  try {
    const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
    if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) return 'face_id';
    if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) return 'touch_id';
    return 'biometric';
  } catch {
    return 'biometric';
  }
}
