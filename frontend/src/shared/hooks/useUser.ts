import { useState, useCallback } from 'react';
import api from '@/shared/api';
import type { UserResponse, UserUpdate, UserListResponse } from '@/shared/api';

interface UserState {
  user: UserResponse | null;
  users: UserListResponse[];
  loading: boolean;
  error: string | null;
}

export function useUser() {
  const [state, setState] = useState<UserState>({
    user: null,
    users: [],
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

  const fetchUsers = useCallback(async (params?: {
    skip?: number;
    limit?: number;
    role?: string;
    hackathon_id?: number;
  }) => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      const users = await api.users.listUsers(params);
      setState((prev) => ({ ...prev, users, loading: false }));
      return users;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to load users';
      setState((prev) => ({ ...prev, error: errorMsg, loading: false }));
      throw error;
    }
  }, []);

  return {
    user: state.user,
    users: state.users,
    loading: state.loading,
    error: state.error,
    getUser,
    fetchUsers,
    updateProfile,
    updateUser: updateProfile, // Alias for backward compatibility
    addSkill,
    removeSkill,
  };
}
