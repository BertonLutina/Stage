import { useLocalSearchParams } from 'expo-router';
import { loadTournamentRegister } from '@/lib/tournamentRegister';
import useAsyncResource from './useAsyncResource';

export default function useTournamentRegister() {
  const { tournamentId, id } = useLocalSearchParams();
  const raw = tournamentId || id;
  const tid = Array.isArray(raw) ? raw[0] : raw;
  return useAsyncResource(
    () => loadTournamentRegister({ tournamentId: tid }),
    [tid],
    { immediate: Boolean(tid) },
  );
}
