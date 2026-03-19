import AsyncStorage from '@react-native-async-storage/async-storage';

const key = (userId) => `@stage_identity_${userId}`;

export async function getIdentity(userId) {
  if (!userId) return null;
  try {
    const raw = await AsyncStorage.getItem(key(userId));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export async function updateIdentity(userId, patch) {
  if (!userId) return null;
  const current = (await getIdentity(userId)) || {};
  const next = { ...current, ...patch };
  try {
    await AsyncStorage.setItem(key(userId), JSON.stringify(next));
  } catch {
    // Non-blocking persistence
  }
  return next;
}

export async function isOnboardingComplete(userId) {
  const identity = await getIdentity(userId);
  return Boolean(identity?.onboardingComplete);
}
