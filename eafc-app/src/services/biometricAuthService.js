import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuthentication from 'expo-local-authentication';
import { Platform } from 'react-native';

const BIOMETRIC_ENABLED_KEY = '@stage_biometric_enabled';
const BIOMETRIC_CREDENTIALS_KEY = '@stage_biometric_credentials';

async function credentialStore() {
  try {
    const SecureStore = require('expo-secure-store');
    return {
      get: SecureStore.getItemAsync,
      set: SecureStore.setItemAsync,
      del: SecureStore.deleteItemAsync,
    };
  } catch {
    return {
      get: (key) => AsyncStorage.getItem(key),
      set: (key, value) => AsyncStorage.setItem(key, value),
      del: (key) => AsyncStorage.removeItem(key),
    };
  }
}

export async function getSupportedBiometricKinds() {
  try {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    if (!hasHardware) return [];
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    if (!enrolled) return [];
    const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
    const kinds = [];
    if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) kinds.push('face');
    if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) kinds.push('fingerprint');
    return kinds;
  } catch {
    return [];
  }
}

export async function isBiometricAvailable() {
  const kinds = await getSupportedBiometricKinds();
  if (Platform.OS === 'ios') return kinds.includes('face');
  return kinds.includes('face') || kinds.includes('fingerprint');
}

export function biometricPromptCopy(kinds = []) {
  if (Platform.OS === 'ios') {
    return {
      promptMessage: 'Use Face ID to sign in',
      buttonLabel: 'Sign in with Face ID',
      settingsLabel: 'Face ID login',
    };
  }
  const face = kinds.includes('face');
  const finger = kinds.includes('fingerprint');
  if (face && finger) {
    return {
      promptMessage: 'Use fingerprint or face to sign in',
      buttonLabel: 'Sign in with fingerprint or face',
      settingsLabel: 'Fingerprint / face login',
    };
  }
  if (face) {
    return {
      promptMessage: 'Use face unlock to sign in',
      buttonLabel: 'Sign in with face',
      settingsLabel: 'Face login',
    };
  }
  return {
    promptMessage: 'Use fingerprint to sign in',
    buttonLabel: 'Sign in with fingerprint',
    settingsLabel: 'Fingerprint login',
  };
}

export async function authenticateForLogin() {
  const available = await isBiometricAvailable();
  if (!available) {
    return { success: false, reason: 'unavailable' };
  }

  const kinds = await getSupportedBiometricKinds();
  const copy = biometricPromptCopy(kinds);

  try {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: copy.promptMessage,
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
  if (!enabled) await clearBiometricCredentials();
}

export async function saveBiometricCredentials(identifier, password) {
  const id = String(identifier || '').trim();
  const pass = String(password || '');
  if (!id || !pass) return false;
  try {
    const store = await credentialStore();
    await store.set(BIOMETRIC_CREDENTIALS_KEY, JSON.stringify({ identifier: id, password: pass }));
    return true;
  } catch {
    return false;
  }
}

export async function getBiometricCredentials() {
  try {
    const store = await credentialStore();
    const raw = await store.get(BIOMETRIC_CREDENTIALS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const identifier = String(parsed?.identifier || '').trim();
    const password = String(parsed?.password || '');
    if (!identifier || !password) return null;
    return { identifier, password };
  } catch {
    return null;
  }
}

export async function hasSavedBiometricCredentials() {
  return Boolean(await getBiometricCredentials());
}

export async function clearBiometricCredentials() {
  try {
    const store = await credentialStore();
    await store.del(BIOMETRIC_CREDENTIALS_KEY);
  } catch {
    // Ignore missing or locked storage.
  }
}

export async function unlockSavedCredentials() {
  const saved = await getBiometricCredentials();
  if (!saved) return { success: false, reason: 'none' };
  const bio = await authenticateForLogin();
  if (!bio.success) return bio;
  return { success: true, credentials: saved };
}

export async function resolveSigninPreference(biometricEnabled) {
  if (!biometricEnabled) return 'normal';
  const kinds = await getSupportedBiometricKinds();
  if (Platform.OS === 'ios') return kinds.includes('face') ? 'face_id' : 'normal';
  if (kinds.includes('face') && kinds.includes('fingerprint')) return 'biometric';
  if (kinds.includes('face')) return 'face_id';
  if (kinds.includes('fingerprint')) return 'fingerprint';
  return 'normal';
}
