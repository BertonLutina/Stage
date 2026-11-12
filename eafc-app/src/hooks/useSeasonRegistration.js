import { resolveMyPlayerAndClub } from '@/api/stageClient';
import { loadSeasonRegistration } from '@/lib/seasonRegistration';
import useAsyncResource from './useAsyncResource';

/**
 * `{ data, loading, error, refreshing, refetch }`;
 * data = { windows, readiness, accessNote, club, user }.
 * The club is the one I preside over, else my club (readiness tells if I can act).
 */
export default function useSeasonRegistration() {
  return useAsyncResource(async () => {
    const identity = await resolveMyPlayerAndClub().catch(() => ({}));
    const club = identity.presidentClub || identity.club || null;
    const data = await loadSeasonRegistration({ clubId: club?.id || null });
    return { ...data, club, user: identity.user || null };
  }, []);
}
