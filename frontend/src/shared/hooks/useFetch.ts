import { useState, useEffect, useCallback } from 'react';

interface FetchState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export function useFetch<T>(
  fetchFn: () => Promise<T>,
  dependencies: any[] = []
) {
  const [state, setState] = useState<FetchState<T>>({
    data: null,
    loading: true,
    error: null,
  });

  const refetch = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      const data = await fetchFn();
      setState((prev) => ({ ...prev, data, loading: false }));
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to fetch data';
      setState((prev) => ({ ...prev, error: errorMsg, loading: false }));
    }
  }, [fetchFn]);

  useEffect(() => {
    refetch();
  }, [refetch, ...dependencies]);

  return {
    data: state.data,
    loading: state.loading,
    error: state.error,
    refetch,
  };
}
