import { useState, useCallback } from 'react';
import api from '@/shared/api';
import type { EnhancedRecommendation, RecommendationRequest } from '@/shared/api';

interface RecommendationsState {
  recommendations: EnhancedRecommendation[];
  totalFound: number;
  loading: boolean;
  error: string | null;
}

export function useRecommendations() {
  const [state, setState] = useState<RecommendationsState>({
    recommendations: [],
    totalFound: 0,
    loading: false,
    error: null,
  });

  const getRecommendations = useCallback(async (request: RecommendationRequest) => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      const response = await api.recommendations.getRecommendations(request);
      setState((prev) => ({
        ...prev,
        recommendations: response.recommendations,
        totalFound: response.total_found,
        loading: false,
      }));
      return response;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to load recommendations';
      setState((prev) => ({ ...prev, error: errorMsg, loading: false }));
      throw error;
    }
  }, []);

  return {
    recommendations: state.recommendations,
    totalFound: state.totalFound,
    loading: state.loading,
    error: state.error,
    getRecommendations,
  };
}
