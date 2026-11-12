import { resolveMyPlayerAndClub } from '@/api/stageClient';
import { loadCompetitionsHub } from '@/lib/competitionsHub';
import useAsyncResource from './useAsyncResource';

/** `{ data, loading, error, refreshing, refetch }`; data = hub sections + my club and president club. */
export default function useCompetitionsHub() {
  return useAsyncResource(async () => {
    const identity = await resolveMyPlayerAndClub().catch(() => ({}));
    const club = identity.club || identity.presidentClub || null;
    const hub = await loadCompetitionsHub({ clubId: club?.id || null });
    return {
      ...hub,
      club,
      presidentClub: identity.presidentClub || null,
      user: identity.user || null,
    };
  }, []);
}
