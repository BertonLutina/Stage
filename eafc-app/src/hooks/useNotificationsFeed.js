import { loadNotificationsFeed } from '@/lib/notificationsFeed';
import useAsyncResource from './useAsyncResource';

/** `{ data: Notification[] (newest first), loading, error, refreshing, refetch }` */
export default function useNotificationsFeed() {
  return useAsyncResource(loadNotificationsFeed, []);
}
