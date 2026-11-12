import { loadLifestyleScreen } from '@/lib/lifestyle';
import useAsyncResource from './useAsyncResource';

/** `{ data: { player, balance, items, purchases }, loading, error, refreshing, refetch }` */
export default function useLifestyle() {
  return useAsyncResource(loadLifestyleScreen, []);
}
