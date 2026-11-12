import { resolveMyPlayerAndClub } from '@/api/stageClient';
import { loadMercatoDesk, loadMyOffers } from '@/lib/mercato';
import useAsyncResource from './useAsyncResource';

/** `{ data: { window, feed }, loading, error, refreshing, refetch }` */
export function useMercatoDesk() {
  return useAsyncResource(loadMercatoDesk, []);
}

/** `{ data: offers[], ... }`: offers I received and offers my club sent. */
export function useMyOffers() {
  return useAsyncResource(async () => {
    const identity = await resolveMyPlayerAndClub().catch(() => ({}));
    return loadMyOffers({
      player: identity.player || null,
      presidentClub: identity.presidentClub || null,
    });
  }, []);
}
