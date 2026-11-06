import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Canonical data-hook contract for the Stage rebuild (plan Task 0.4).
 *
 * Every `use<Domain>` hook built for a rebuilt screen returns this shape so
 * screens stay presentational and handle loading / empty / error / refresh
 * the same way:
 *
 *   { data, loading, error, refreshing, refetch }
 *
 * - `loading`    true only during the first load (empty-state vs skeleton).
 * - `refreshing` true during a manual `refetch()` (pull-to-refresh), while
 *                the previously loaded `data` stays on screen.
 * - `error`      a string message; a rejected fetch (including a 401) sets it
 *                and never throws out of the hook.
 * - `refetch()`  re-runs the fetcher as a refresh.
 *
 * @param {() => Promise<any>} fetcher  async function returning the payload
 * @param {Array} deps                  re-run the initial load when these change
 * @param {{ initialData?: any, immediate?: boolean }} [options]
 */
export default function useAsyncResource(fetcher, deps = [], options = {}) {
  const { initialData, immediate = true } = options;

  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(immediate);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const run = useCallback(async (isRefresh) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const result = await fetcherRef.current();
      if (mountedRef.current) setData(result);
    } catch (err) {
      if (mountedRef.current) {
        setError(err?.message || 'Something went wrong');
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  const refetch = useCallback(() => run(true), [run]);

  useEffect(() => {
    if (immediate) run(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, loading, error, refreshing, refetch };
}
