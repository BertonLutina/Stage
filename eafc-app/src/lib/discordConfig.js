/** Discord config for Stage mobile (mirrors web defaults). */
export const DISCORD_SERVER_ID = String(
  process.env.EXPO_PUBLIC_DISCORD_SERVER_ID || '1504515556458496050'
).trim();

export const DISCORD_INVITE_URL = String(
  process.env.EXPO_PUBLIC_DISCORD_INVITE_URL || 'https://discord.gg/YEe4M7T75'
).trim();

export function isDiscordConfigured() {
  return Boolean(DISCORD_SERVER_ID || DISCORD_INVITE_URL);
}

export function discordWidgetSrc(theme = 'dark') {
  if (!DISCORD_SERVER_ID) return null;
  return `https://discord.com/widget?id=${encodeURIComponent(DISCORD_SERVER_ID)}&theme=${theme}`;
}
