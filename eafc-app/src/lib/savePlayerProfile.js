import { stageClient } from '../api/stageClient';
import { COUNTRIES } from './countries';

/**
 * Build the Stage Player payload from onboarding fields. Shared by the single
 * PlayerSetup screen and the combined step flow so both persist identically.
 * `secondaryPosition === 'none'` clears the field; starting balances match the
 * onboarding default.
 */
export function buildPlayerPayload({ user, gamertag, position, secondaryPosition, country, platform }) {
  const foundCountry = COUNTRIES.find((c) => c.name === country);
  return {
    user_id: user?.id,
    gamertag: String(gamertag || '').trim(),
    email: user?.email,
    position,
    secondary_position: secondaryPosition === 'none' ? null : secondaryPosition,
    country,
    country_code: foundCountry?.code || '',
    platform,
    credits: 50,
    stc: 50000,
  };
}

/**
 * Persist the player's onboarding profile to Stage: update the existing Player
 * (found by `user.player_id`, else by email) or create one. Returns the saved
 * Player. The real backend write for onboarding — do not replace with the
 * local-only `updateIdentity` cache.
 */
export async function savePlayerProfile({ user, ...fields }) {
  const payload = buildPlayerPayload({ user, ...fields });

  let existing = [];
  if (user?.player_id) {
    const p = await stageClient.entities.Player.get(user.player_id).catch(() => null);
    existing = p ? [p] : [];
  } else {
    existing = await stageClient.entities.Player.filter({ email: user?.email }, null, 1).catch(() => []);
  }

  if (existing?.length) {
    return stageClient.entities.Player.update(existing[0].id, payload);
  }
  return stageClient.entities.Player.create(payload);
}
