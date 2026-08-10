import { useCallback, useEffect, useMemo, useState } from 'react';
import { stageClient } from '../api/stageClient';

function isFuture(date) {
  if (!date) return false;
  return new Date(date) > new Date();
}

function isPastOrNow(date) {
  if (!date) return true;
  return new Date(date) <= new Date();
}

export default function useTournamentsList() {
  const [tournaments, setTournaments] = useState([]);
  const [trophyItems, setTrophyItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [canCreate, setCanCreate] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [rows, trophies] = await Promise.all([
        stageClient.entities.Tournament.list('-created_date', 100).catch(() => []),
        stageClient.entities.TrophyItem
          ? stageClient.entities.TrophyItem.list('sort_order', 50).catch(() => [])
          : Promise.resolve([]),
      ]);
      const list = (Array.isArray(rows) ? rows : []).filter(
        (t) => t?.status !== 'cancelled' && t?.status !== 'archived'
      );
      setTournaments(list);
      setTrophyItems(Array.isArray(trophies) ? trophies : []);
      setCanCreate(true);
    } catch (err) {
      setTournaments([]);
      setError(err?.message || 'Failed to load tournaments');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const buckets = useMemo(() => {
    const now = new Date();
    const stageTournaments = tournaments.filter((t) => !t.creator_gamertag);
    const communityTournaments = tournaments.filter((t) => !!t.creator_gamertag);
    const open = communityTournaments.filter(
      (t) =>
        t.status === 'registration' ||
        (t.status === 'in_progress' && t.start_date && isFuture(t.start_date))
    );
    const live = communityTournaments.filter(
      (t) => t.status === 'in_progress' && (!t.start_date || isPastOrNow(t.start_date))
    );
    const done = communityTournaments.filter((t) => t.status === 'completed');
    const trophyShowcase = [...stageTournaments, ...communityTournaments]
      .filter((t) => t.trophy_url || t.trophy_item_id)
      .filter((t) => t.status !== 'completed')
      .slice(0, 12);

    return { stageTournaments, open, live, done, trophyShowcase, now };
  }, [tournaments]);

  return {
    tournaments,
    trophyItems,
    loading,
    error,
    canCreate,
    reload: load,
    ...buckets,
  };
}
