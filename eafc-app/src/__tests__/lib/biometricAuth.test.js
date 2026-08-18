import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuthentication from 'expo-local-authentication';
import { Platform } from 'react-native';
import {
  biometricPromptCopy,
  getSupportedBiometricKinds,
  isBiometricAvailable,
  saveBiometricCredentials,
  setBiometricEnabled,
  unlockSavedCredentials,
} from '../../services/biometricAuthService';

jest.mock('expo-local-authentication', () => ({
  hasHardwareAsync: jest.fn(),
  isEnrolledAsync: jest.fn(),
  supportedAuthenticationTypesAsync: jest.fn(),
  authenticateAsync: jest.fn(),
  AuthenticationType: {
    FINGERPRINT: 1,
    FACIAL_RECOGNITION: 2,
  },
}));

const FACE = LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION;
const FINGER = LocalAuthentication.AuthenticationType.FINGERPRINT;

function mockHardware(types) {
  LocalAuthentication.hasHardwareAsync.mockResolvedValue(true);
  LocalAuthentication.isEnrolledAsync.mockResolvedValue(true);
  LocalAuthentication.supportedAuthenticationTypesAsync.mockResolvedValue(types);
}

describe('biometric login', () => {
  const originalOS = Platform.OS;

  beforeEach(() => {
    jest.clearAllMocks();
    AsyncStorage.getItem.mockResolvedValue(null);
    AsyncStorage.setItem.mockResolvedValue();
    AsyncStorage.removeItem.mockResolvedValue();
  });

  afterEach(() => {
    Platform.OS = originalOS;
  });

  test('iOS only accepts Face ID, not Touch ID', async () => {
    Platform.OS = 'ios';
    mockHardware([FINGER]);
    expect(await isBiometricAvailable()).toBe(false);
    mockHardware([FACE]);
    expect(await isBiometricAvailable()).toBe(true);
    expect(await getSupportedBiometricKinds()).toEqual(['face']);
  });

  test('Android accepts fingerprint or face', async () => {
    Platform.OS = 'android';
    mockHardware([FINGER]);
    expect(await isBiometricAvailable()).toBe(true);
    mockHardware([FACE]);
    expect(await isBiometricAvailable()).toBe(true);
    mockHardware([FACE, FINGER]);
    expect(await getSupportedBiometricKinds()).toEqual(['face', 'fingerprint']);
  });

  test('saves login and unlocks it after Face ID', async () => {
    Platform.OS = 'ios';
    mockHardware([FACE]);
    LocalAuthentication.authenticateAsync.mockResolvedValue({ success: true });
    AsyncStorage.getItem.mockImplementation(async (key) => {
      if (key === '@stage_biometric_credentials') {
        return JSON.stringify({ identifier: 'neo', password: 'secret' });
      }
      return null;
    });

    await saveBiometricCredentials('neo', 'secret');
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      '@stage_biometric_credentials',
      JSON.stringify({ identifier: 'neo', password: 'secret' }),
    );

    const unlocked = await unlockSavedCredentials();
    expect(unlocked).toEqual({
      success: true,
      credentials: { identifier: 'neo', password: 'secret' },
    });
  });

  test('turning biometric off clears the saved login', async () => {
    await setBiometricEnabled(false);
    expect(AsyncStorage.setItem).toHaveBeenCalledWith('@stage_biometric_enabled', 'false');
    expect(AsyncStorage.removeItem).toHaveBeenCalledWith('@stage_biometric_credentials');
  });

  test('iOS prompt copy is Face ID only', () => {
    Platform.OS = 'ios';
    expect(biometricPromptCopy(['face']).buttonLabel).toBe('Sign in with Face ID');
  });

  test('login screen stores credentials and unlocks with biometrics', () => {
    const fs = require('fs');
    const path = require('path');
    const page = fs.readFileSync(path.join(__dirname, '../../app/auth/loginscreen.jsx'), 'utf8');
    expect(page).toMatch(/saveBiometricCredentials/);
    expect(page).toMatch(/unlockSavedCredentials/);
    expect(page).toMatch(/Sign in with Face ID|bioCopy\.buttonLabel/);
  });
});
