import { useState, useCallback } from 'react';
import api from '@/shared/api';
import type { RequestResponse, RequestCreate } from '@/shared/api';

interface RequestsState {
  incoming: RequestResponse[];
  outgoing: RequestResponse[];
  loading: boolean;
  error: string | null;
}

export function useRequests() {
  const [state, setState] = useState<RequestsState>({
    incoming: [],
    outgoing: [],
    loading: false,
    error: null,
  });

  const getIncomingRequests = useCallback(
    async (params?: { status?: string; skip?: number; limit?: number }) => {
      try {
        setState((prev) => ({ ...prev, loading: true, error: null }));
        const incoming = await api.requests.getIncoming(params);
        setState((prev) => ({ ...prev, incoming, loading: false }));
        return incoming;
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Failed to load incoming requests';
        setState((prev) => ({ ...prev, error: errorMsg, loading: false }));
        throw error;
      }
    },
    []
  );

  const getOutgoingRequests = useCallback(
    async (params?: { status?: string; skip?: number; limit?: number }) => {
      try {
        setState((prev) => ({ ...prev, loading: true, error: null }));
        const outgoing = await api.requests.getOutgoing(params);
        setState((prev) => ({ ...prev, outgoing, loading: false }));
        return outgoing;
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Failed to load outgoing requests';
        setState((prev) => ({ ...prev, error: errorMsg, loading: false }));
        throw error;
      }
    },
    []
  );

  const sendRequest = useCallback(async (data: RequestCreate) => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      const request = await api.requests.create(data);
      setState((prev) => ({
        ...prev,
        outgoing: [...prev.outgoing, request],
        loading: false,
      }));
      return request;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to send request';
      setState((prev) => ({ ...prev, error: errorMsg, loading: false }));
      throw error;
    }
  }, []);

  const acceptRequest = useCallback(async (requestId: number) => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      const request = await api.requests.accept(requestId);
      setState((prev) => ({
        ...prev,
        incoming: prev.incoming.map((r) => (r.id === requestId ? request : r)),
        loading: false,
      }));
      return request;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to accept request';
      setState((prev) => ({ ...prev, error: errorMsg, loading: false }));
      throw error;
    }
  }, []);

  const declineRequest = useCallback(async (requestId: number) => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      const request = await api.requests.decline(requestId);
      setState((prev) => ({
        ...prev,
        incoming: prev.incoming.filter((r) => r.id !== requestId),
        loading: false,
      }));
      return request;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to decline request';
      setState((prev) => ({ ...prev, error: errorMsg, loading: false }));
      throw error;
    }
  }, []);

  return {
    incoming: state.incoming,
    outgoing: state.outgoing,
    loading: state.loading,
    error: state.error,
    getIncomingRequests,
    getOutgoingRequests,
    sendRequest,
    acceptRequest,
    declineRequest,
  };
}
