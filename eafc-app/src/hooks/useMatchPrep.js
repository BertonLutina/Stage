import { useLocalSearchParams } from 'expo-router';
import { loadMatchPrep } from '@/lib/matchPrep';
import useAsyncResource from './useAsyncResource';

export default function useMatchPrep() {
  const { matchId } = useLocalSearchParams();
  const id = Array.isArray(matchId) ? matchId[0] : matchId;
  return useAsyncResource(
    () => loadMatchPrep({ matchId: id }),
    [id],
    { immediate: Boolean(id) },
  );
}
