import { useState, useCallback } from 'react';
import api from '@/shared/api';
import type { HackathonResponse } from '@/shared/api';

interface HackathonsState {
  hackathons: HackathonResponse[];
  current: HackathonResponse | null;
  loading: boolean;
  error: string | null;
}

export function useHackathons() {
  const [state, setState] = useState<HackathonsState>({
    hackathons: [],
    current: null,
    loading: false,
    error: null,
  });

  const getHackathons = useCallback(
    async (params?: { skip?: number; limit?: number; is_active?: boolean }) => {
      try {
        setState((prev) => ({ ...prev, loading: true, error: null }));
        const hackathons = await api.hackathons.getList(params);
        setState((prev) => ({ ...prev, hackathons, loading: false }));
        return hackathons;
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Failed to load hackathons';
        setState((prev) => ({ ...prev, error: errorMsg, loading: false }));
        throw error;
      }
    },
    []
  );

  const getHackathon = useCallback(async (id: number) => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      const hackathon = await api.hackathons.getOne(id);
      setState((prev) => ({ ...prev, current: hackathon, loading: false }));
      return hackathon;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to load hackathon';
      setState((prev) => ({ ...prev, error: errorMsg, loading: false }));
      throw error;
    }
  }, []);

  const setCurrent = useCallback((hackathon: HackathonResponse | null) => {
    setState((prev) => ({ ...prev, current: hackathon }));
  }, []);

  return {
    hackathons: state.hackathons,
    current: state.current,
    loading: state.loading,
    error: state.error,
    getHackathons,
    fetchHackathons: getHackathons, // Alias for backward compatibility
    getHackathon,
    setCurrent,
  };
}
