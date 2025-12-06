import { useState, useCallback } from 'react';
import api from '@/shared/api';
import type { TeamResponse, TeamCreate, TeamUpdate, UserResponse } from '@/shared/api';

interface TeamState {
  team: TeamResponse | null;
  members: UserResponse[];
  loading: boolean;
  error: string | null;
}

export function useTeam() {
  const [state, setState] = useState<TeamState>({
    team: null,
    members: [],
    loading: false,
    error: null,
  });

  const getTeam = useCallback(async (teamId: number) => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      const team = await api.teams.getOne(teamId);
      setState((prev) => ({
        ...prev,
        team,
        members: team.members || [],
        loading: false,
      }));
      return team;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to load team';
      setState((prev) => ({ ...prev, error: errorMsg, loading: false }));
      throw error;
    }
  }, []);

  const createTeam = useCallback(async (data: TeamCreate) => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      const team = await api.teams.create(data);
      setState((prev) => ({
        ...prev,
        team,
        members: team.members || [],
        loading: false,
      }));
      return team;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to create team';
      setState((prev) => ({ ...prev, error: errorMsg, loading: false }));
      throw error;
    }
  }, []);

  const updateTeam = useCallback(async (teamId: number, data: TeamUpdate) => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      const team = await api.teams.update(teamId, data);
      setState((prev) => ({
        ...prev,
        team,
        members: team.members || [],
        loading: false,
      }));
      return team;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to update team';
      setState((prev) => ({ ...prev, error: errorMsg, loading: false }));
      throw error;
    }
  }, []);

  const joinTeam = useCallback(async (teamId: number) => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      const team = await api.teams.join(teamId);
      setState((prev) => ({
        ...prev,
        team,
        members: team.members || [],
        loading: false,
      }));
      return team;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to join team';
      setState((prev) => ({ ...prev, error: errorMsg, loading: false }));
      throw error;
    }
  }, []);

  const leaveTeam = useCallback(async (teamId: number) => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      const team = await api.teams.leave(teamId);
      setState((prev) => ({
        ...prev,
        team: null,
        members: [],
        loading: false,
      }));
      return team;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to leave team';
      setState((prev) => ({ ...prev, error: errorMsg, loading: false }));
      throw error;
    }
  }, []);

  const addMember = useCallback(async (teamId: number, userId: number) => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      const team = await api.teams.addMember(teamId, userId);
      setState((prev) => ({
        ...prev,
        team,
        members: team.members || [],
        loading: false,
      }));
      return team;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to add member';
      setState((prev) => ({ ...prev, error: errorMsg, loading: false }));
      throw error;
    }
  }, []);

  const removeMember = useCallback(async (teamId: number, userId: number) => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      const team = await api.teams.removeMember(teamId, userId);
      setState((prev) => ({
        ...prev,
        team,
        members: team.members || [],
        loading: false,
      }));
      return team;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to remove member';
      setState((prev) => ({ ...prev, error: errorMsg, loading: false }));
      throw error;
    }
  }, []);

  return {
    team: state.team,
    members: state.members,
    loading: state.loading,
    error: state.error,
    getTeam,
    createTeam,
    updateTeam,
    joinTeam,
    leaveTeam,
    addMember,
    removeMember,
  };
}
