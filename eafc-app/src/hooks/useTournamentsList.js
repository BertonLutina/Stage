import { useEffect, useState } from 'react';
import api from '../utils/api';

export default function useTournamentsList() {
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const res = await api.get('/tournaments/list');
        if (!cancelled) setTournaments(res.data?.data || []);
      } catch {
        if (!cancelled) setTournaments([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return { tournaments, loading };
}

