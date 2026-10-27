/** Display-only platform labels (account identity / matchmaking keep stored values). */
export function formatProfilePlatform(value, fallback = '—') {
  const raw = String(value ?? '').trim();
  const key = raw.toLowerCase().replace(/[\s_-]+/g, '');
  if (['playstation', 'ps', 'playstation5', 'ps5'].includes(key)) return 'PS5';
  if (['playstation4', 'ps4'].includes(key)) return 'PS4';
  if (['xbox', 'xboxone', 'xboxseries', 'xboxseriesx', 'xboxseriess', 'xboxseriesx/s'].includes(key)) {
    return 'Xbox';
  }
  if (['pc', 'windows'].includes(key)) return 'PC';
  if (['crossplatform', 'crossplay'].includes(key)) return 'Cross-Platform';
  return raw || fallback;
}
