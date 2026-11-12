import { resolveMyPlayerAndClub } from '@/api/stageClient';
import { loadRankings } from '@/lib/rankings';
import useAsyncResource from './useAsyncResource';

/** `{ data, loading, error, refreshing, refetch }`; data = { clubs, players, fullAccess, club, player }. */
export default function useRankings() {
  return useAsyncResource(async () => {
    const [rankings, identity] = await Promise.all([
      loadRankings(),
      resolveMyPlayerAndClub().catch(() => ({})),
    ]);
    return { ...rankings, club: identity.club || null, player: identity.player || null };
  }, []);
}
