import { resolveMyPlayerAndClub } from '@/api/stageClient';
import { getNativePushStatus } from '@/lib/oneSignal';
import { mergeLoaded } from '@/lib/notificationPrefs';
import useAsyncResource from './useAsyncResource';

async function loadNotificationSettings() {
  const resolved = await resolveMyPlayerAndClub();
  const player = resolved?.player || null;
  const push = await getNativePushStatus().catch(() => ({ configured: false, permission: false, optedIn: false }));
  return { player, push, settings: player ? mergeLoaded(player.notification_settings) : null };
}

/** `{ data: { player, push, settings } | undefined, loading, error, refreshing, refetch }` */
export default function useNotificationSettings() {
  return useAsyncResource(loadNotificationSettings, []);
}
