'use client';
import { useCallback, useEffect, useState } from 'react';
import { api } from './api';

/** Debounce any changing value (e.g., live search input) so typing feels smooth without spamming API requests. */
export function useDebouncedValue<T>(value: T, delay = 280): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

/** GET `path` (null = skip); refetches when the path changes, keeping previous data visible during updates. */
export function useFetch<T>(path: string | null) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(!!path);
  const reload = useCallback(async (silent = false) => {
    if (!path) return;
    if (!silent) setLoading(true);
    try { setData(await api<T>(path)); setError(null); }
    catch (e) { setError((e as Error).message); }
    finally { setLoading(false); }
  }, [path]);
  useEffect(() => { reload(); }, [reload]);
  return { data, error, loading, reload, setData };
}
