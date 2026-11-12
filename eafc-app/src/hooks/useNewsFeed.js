import { NEWS_LOADERS } from '@/lib/newsFeed';
import useAsyncResource from './useAsyncResource';

/** `{ data: NewsItem[] (newest first), loading, error, refreshing, refetch }` for one tab. */
export default function useNewsFeed(tab = 'world') {
  return useAsyncResource(() => (NEWS_LOADERS[tab] || NEWS_LOADERS.world)(), [tab]);
}
