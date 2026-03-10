import { useEffect, useState } from 'react';
import api from '../utils/api';

export default function useFeed() {
  const [feed, setFeed] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const res = await api.get(`/social/feed?page=${page}`);
        const data = res.data?.data || [];
        if (cancelled) return;
        setFeed(prev => (page === 1 ? data : [...prev, ...data]));
      } catch {
        if (!cancelled && page === 1) setFeed([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [page]);

  const loadMore = () => setPage(p => p + 1);

  const refresh = async () => {
    setRefreshing(true);
    try {
      setPage(1);
    } finally {
      setRefreshing(false);
    }
  };

  return { feed, loading, refreshing, loadMore, refresh };
}

