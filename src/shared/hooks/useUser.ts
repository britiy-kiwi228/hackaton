import { useState, useCallback } from 'react';
import api from '@/shared/api';
import type { UserResponse, UserUpdate } from '@/shared/api';

interface UserState {
  user: UserResponse | null;
  loading: boolean;
  error: string | null;
}

export function useUser() {
  const [state, setState] = useState<UserState>({
    user: null,
    loading: false,
    error: null,
  });

  const getUser = useCallback(async (userId: number) => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      const user = await api.users.getUser(userId);
      setState((prev) => ({ ...prev, user, loading: false }));
      return user;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to load user';
      setState((prev) => ({ ...prev, error: errorMsg, loading: false }));
      throw error;
    }
  }, []);

  const updateProfile = useCallback(async (data: UserUpdate) => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      const updatedUser = await api.users.updateProfile(data);
      setState((prev) => ({ ...prev, user: updatedUser, loading: false }));
      return updatedUser;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to update profile';
      setState((prev) => ({ ...prev, error: errorMsg, loading: false }));
      throw error;
    }
  }, []);

  const addSkill = useCallback(async (skillName: string) => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      const updatedUser = await api.users.addSkills([skillName]);
      setState((prev) => ({ ...prev, user: updatedUser, loading: false }));
      return updatedUser;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to add skill';
      setState((prev) => ({ ...prev, error: errorMsg, loading: false }));
      throw error;
    }
  }, []);

  const removeSkill = useCallback(async (skillId: number) => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      const updatedUser = await api.users.removeSkill(skillId);
      setState((prev) => ({ ...prev, user: updatedUser, loading: false }));
      return updatedUser;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to remove skill';
      setState((prev) => ({ ...prev, error: errorMsg, loading: false }));
      throw error;
    }
  }, []);

  return {
    user: state.user,
    loading: state.loading,
    error: state.error,
    getUser,
    updateProfile,
    addSkill,
    removeSkill,
  };
}
