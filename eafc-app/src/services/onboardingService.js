import { localStorage } from '../lib/polyfillStorage';
import { updateIdentity, isOnboardingComplete as identityOnboardingComplete } from './playerIdentityService';
import {
  clearNeedsOnboarding,
  userNeedsOnboarding,
  resolveMyPlayerAndClub,
} from '../api/stageClient';
import { getOwnedClubId, getPresidentClubId } from '../lib/userIdentityFields';

function completedKey(userId) {
  return `stage_onboarding_completed_${userId}`;
}

export async function markOnboardingComplete(userId) {
  if (!userId) return;
  try {
    localStorage.setItem(completedKey(userId), '1');
    clearNeedsOnboarding(userId);
  } catch {
    /* ignore */
  }
  await updateIdentity(userId, { onboardingComplete: true });
}

export async function hasCompletedOnboarding(userId) {
  if (!userId) return false;
  if (userNeedsOnboarding(userId)) return false;
  try {
    if (localStorage.getItem(completedKey(userId)) === '1') return true;
  } catch {
    /* ignore */
  }
  if (await identityOnboardingComplete(userId)) return true;
  return false;
}

/**
 * Same gate logic as web AuthenticatedApp:
 * skip onboarding if profile already exists (unless force flag).
 */
export async function shouldShowOnboarding(user) {
  if (!user?.id) return false;
  if (userNeedsOnboarding(user.id)) return true;
  if (await hasCompletedOnboarding(user.id)) return false;

  try {
    const { player, presidentClub, club } = await resolveMyPlayerAndClub();
    const owned = getOwnedClubId(user) || getPresidentClubId(user);
    if (user.player_id || player?.id) {
      // Stub OAuth players without country still need setup.
      if (player?.country || player?.gamertag) return false;
      return true;
    }
    if (owned || presidentClub?.id || club?.id) return false;
  } catch {
    /* fall through */
  }
  return true;
}
