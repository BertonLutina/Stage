/**
 * Public player directory eligibility — same rule as STAGE web.
 * OAuth stubs from president-only onboarding stay off the public list.
 * Completing PlayerSetup always sets country / country_code.
 */
export function isPublicPlayerProfile(player) {
  if (!player?.id) return false;
  const country = String(player.country || '').trim();
  const countryCode = String(player.country_code || '').trim();
  return Boolean(country || countryCode);
}

export function filterPublicPlayerProfiles(players) {
  if (!Array.isArray(players)) return [];
  return players.filter(isPublicPlayerProfile);
}
