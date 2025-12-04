import { useState, useCallback, useEffect } from 'react';
import api from '@/shared/api';
import type { UserResponse, TokenResponse } from '@/shared/api';

interface AuthState {
  token: string | null;
  user: UserResponse | null;
  loading: boolean;
  error: string | null;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    token: localStorage.getItem('token'),
    user: null,
    loading: false,
    error: null,
  });

  const loadUser = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      const user = await api.users.getMe();
      setState((prev) => ({ ...prev, user, loading: false }));
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to load user';
      setState((prev) => ({ ...prev, error: errorMsg, loading: false }));
    }
  }, []);

  const loginWithTelegram = useCallback(
    async (authData: Record<string, string>) => {
      try {
        setState((prev) => ({ ...prev, loading: true, error: null }));
        const response: TokenResponse = await api.auth.loginTelegram(authData);
        localStorage.setItem('token', response.access_token);

        const user = await api.users.getMe();
        setState((prev) => ({
          ...prev,
          token: response.access_token,
          user,
          loading: false,
        }));
        return { success: true };
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Login failed';
        setState((prev) => ({ ...prev, error: errorMsg, loading: false }));
        return { success: false, error: errorMsg };
      }
    },
    []
  );

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setState({
      token: null,
      user: null,
      loading: false,
      error: null,
    });
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  return {
    token: state.token,
    user: state.user,
    loading: state.loading,
    error: state.error,
    loginWithTelegram,
    logout,
    loadUser,
    isAuthenticated: !!state.token && !!state.user,
  };
}
