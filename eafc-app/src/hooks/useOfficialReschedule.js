import { useLocalSearchParams } from 'expo-router';
import { loadOfficialReschedule } from '@/lib/officialReschedule';
import useAsyncResource from './useAsyncResource';

export default function useOfficialReschedule() {
  const { matchId } = useLocalSearchParams();
  const id = Array.isArray(matchId) ? matchId[0] : matchId;
  return useAsyncResource(
    () => loadOfficialReschedule({ matchId: id }),
    [id],
    { immediate: Boolean(id) },
  );
}
