import { useEffect, useRef } from 'react';
import { stageClient } from '@/api/stageClient';
import { resolveGameDayMatchEvent } from '@/lib/gameDayRealtime';

export function useGameDayMatchRealtime({
  matchId,
  reloadMatch,
  onMatch,
}) {
  const onMatchRef = useRef(onMatch);
  const reloadRef = useRef(reloadMatch);
  onMatchRef.current = onMatch;
  reloadRef.current = reloadMatch;

  useEffect(() => {
    if (!matchId) return undefined;
    let cancelled = false;

    const refreshMatch = async (event) => {
      const resolved = resolveGameDayMatchEvent(event, matchId);
      if (resolved?.type === 'delete') {
        onMatchRef.current?.({ deleted: true, id: matchId });
        return;
      }
      // Match socket is global. Other people's fixtures must not refetch this one.
      if (!resolved) return;
      const fresh = await reloadRef.current?.(matchId).catch(() => resolved?.match || null);
      if (cancelled || !fresh) return;
      onMatchRef.current?.(fresh);
    };

    const unsubMatch = stageClient.entities.Match.subscribe((event) => {
      refreshMatch(event);
    }, { id: matchId });

    return () => {
      cancelled = true;
      if (typeof unsubMatch === 'function') unsubMatch();
    };
  }, [matchId]);
}
