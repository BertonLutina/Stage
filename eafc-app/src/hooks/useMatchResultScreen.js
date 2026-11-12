import { useCallback, useEffect, useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { resolveMyPlayerAndClub } from '@/api/stageClient';
import {
  pickMyClubForMatch,
  reloadMatch,
  resolveMatchSides,
  uniqueIdentityClubs,
} from '@/lib/gameDayOps';
import { getResultSubmissionControls } from '@/lib/gameDayResultFlow';

/** Shared identity + match load for ReportResult / ConfirmResult screens. */
export default function useMatchResultScreen() {
  const { matchId } = useLocalSearchParams();
  const id = Array.isArray(matchId) ? matchId[0] : matchId;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(Boolean(id));
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async (isRefresh = false) => {
    if (!id) {
      setError('Missing match');
      setLoading(false);
      return;
    }
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const identity = await resolveMyPlayerAndClub().catch(() => ({}));
      const clubs = uniqueIdentityClubs(
        identity.player?.club_id ? { id: identity.player.club_id } : null,
        identity.club,
        identity.presidentClub,
      );
      const match = await reloadMatch(id);
      if (!match) throw new Error('Match not found');
      const club = pickMyClubForMatch(match, clubs);
      const sides = resolveMatchSides(match, clubs, identity.player);
      const controls = getResultSubmissionControls({
        game: match,
        isLive: match.status === 'in_progress' || Boolean(match.result_state),
        showResultForm: false,
        amIHomeTeam: sides.amIHomeTeam,
      });
      setData({
        match,
        club,
        player: identity.player || null,
        sides,
        controls,
        identity,
      });
    } catch (err) {
      setError(err?.message || 'Something went wrong');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id]);

  useEffect(() => { load(false); }, [load]);

  return {
    data,
    loading,
    error,
    refreshing,
    refetch: () => load(true),
    matchId: id,
  };
}
