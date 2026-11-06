import { useCallback } from 'react';
import { resolveMyPlayerAndClub } from '@/api/stageClient';
import { loadClubDirectory, loadPlayerDirectory } from '@/lib/stageDirectories';
import useAsyncResource from './useAsyncResource';

const INITIAL_DATA = { players: [], clubs: [], playerClubs: {}, identity: {} };

/** Load the two real public directories behind the unified Search tab. */
export default function useSearchDirectory() {
  const fetcher = useCallback(async () => {
    const [playerDirectory, clubs, identity] = await Promise.all([
      loadPlayerDirectory(),
      loadClubDirectory(),
      resolveMyPlayerAndClub().catch(() => ({})),
    ]);
    return {
      players: playerDirectory?.players || [],
      playerClubs: playerDirectory?.clubs || {},
      clubs: clubs || [],
      identity: identity || {},
    };
  }, []);

  return useAsyncResource(fetcher, [], { initialData: INITIAL_DATA });
}
