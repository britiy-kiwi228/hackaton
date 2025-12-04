import React, { createContext, useContext } from 'react';
import { useAuth } from '@/shared/hooks';
import type { UserResponse } from '@/shared/api';

interface AuthContextType {
  token: string | null;
  user: UserResponse | null;
  loading: boolean;
  error: string | null;
  login: (authData: Record<string, string>) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const auth = useAuth();

  return (
    <AuthContext.Provider
      value={{
        token: auth.token,
        user: auth.user,
        loading: auth.loading,
        error: auth.error,
        login: auth.loginWithTelegram,
        logout: auth.logout,
        isAuthenticated: auth.isAuthenticated,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within AuthProvider');
  }
  return context;
}
