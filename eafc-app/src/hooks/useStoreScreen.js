import { loadStoreScreen } from '@/lib/store';
import useAsyncResource from './useAsyncResource';

/** `{ data: { player, config, credits, stc }, loading, error, refreshing, refetch }` */
export default function useStoreScreen() {
  return useAsyncResource(loadStoreScreen, []);
}
