import { useCallback, useEffect, useState } from 'react';
import { isApiConfigured } from '@/lib/api/client';

export function useApiData<T>(
  mockData: T,
  fetcher: () => Promise<T>,
  deps: unknown[] = [],
): { data: T; loading: boolean; error: string | null; refresh: () => void } {
  const [data, setData] = useState<T>(mockData);
  const [loading, setLoading] = useState(isApiConfigured());
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!isApiConfigured()) {
      setData(mockData);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await fetcher();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
      setData(mockData);
    } finally {
      setLoading(false);
    }
  }, [mockData, fetcher, ...deps]);

  useEffect(() => {
    void load();
  }, [load]);

  return { data, loading, error, refresh: load };
}
