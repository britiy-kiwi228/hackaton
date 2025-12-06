import client from './client';
import {
  UserResponse,
  UserListResponse,
  UserUpdate,
  TeamResponse,
  TeamListResponse,
  TeamCreate,
  TeamUpdate,
  RequestResponse,
  RequestCreate,
  RecommendationResponse,
  RecommendationRequest,
  HackathonResponse,
  TokenResponse,
} from './types';

// ==================== AUTH ENDPOINTS ====================

export const authAPI = {
  loginTelegram: async (authData: Record<string, string>): Promise<TokenResponse> => {
    const response = await client.post<TokenResponse>('/users/auth/telegram', {
      auth_data: authData,
    });
    return response.data;
  },
};

// ==================== USERS ENDPOINTS ====================

export const usersAPI = {
  getMe: async (): Promise<UserResponse> => {
    const response = await client.get<UserResponse>('/users/me');
    return response.data;
  },

  getUser: async (userId: number): Promise<UserResponse> => {
    const response = await client.get<UserResponse>(`/users/${userId}`);
    return response.data;
  },

  listUsers: async (params?: {
    skip?: number;
    limit?: number;
    role?: string;
    hackathon_id?: number;
    team_id?: number;
  }): Promise<UserListResponse[]> => {
    const response = await client.get<UserListResponse[]>('/users', { params });
    return response.data;
  },

  updateProfile: async (data: UserUpdate): Promise<UserResponse> => {
    const response = await client.put<UserResponse>('/users/me', data);
    return response.data;
  },

  addSkills: async (skillNames: string[]): Promise<UserResponse> => {
    const response = await client.post<UserResponse>('/users/me/skills', {
      skills: skillNames,
    });
    return response.data;
  },

  removeSkill: async (skillId: number): Promise<UserResponse> => {
    const response = await client.delete<UserResponse>(`/users/me/skills/${skillId}`);
    return response.data;
  },
};

// ==================== TEAMS ENDPOINTS ====================

export const teamsAPI = {
  create: async (data: TeamCreate): Promise<TeamResponse> => {
    const response = await client.post<TeamResponse>('/teams', data);
    return response.data;
  },

  getOne: async (teamId: number): Promise<TeamResponse> => {
    const response = await client.get<TeamResponse>(`/teams/${teamId}`);
    return response.data;
  },

  getById: async (teamId: number): Promise<TeamResponse> => {
    const response = await client.get<TeamResponse>(`/teams/${teamId}`);
    return response.data;
  },

  getList: async (params?: {
    hackathon_id?: number;
    skip?: number;
    limit?: number;
    is_looking?: boolean;
  }): Promise<TeamListResponse[]> => {
    const response = await client.get<TeamListResponse[]>('/teams', { params });
    return response.data;
  },

  update: async (teamId: number, data: TeamUpdate): Promise<TeamResponse> => {
    const response = await client.put<TeamResponse>(`/teams/${teamId}`, data);
    return response.data;
  },

  join: async (teamId: number): Promise<TeamResponse> => {
    const response = await client.post<TeamResponse>(`/teams/${teamId}/join`);
    return response.data;
  },

  leave: async (teamId: number): Promise<TeamResponse> => {
    const response = await client.post<TeamResponse>(`/teams/${teamId}/leave`);
    return response.data;
  },

  addMember: async (teamId: number, userId: number): Promise<TeamResponse> => {
    const response = await client.post<TeamResponse>(`/teams/${teamId}/members`, {
      user_id: userId,
    });
    return response.data;
  },

  removeMember: async (teamId: number, userId: number): Promise<TeamResponse> => {
    const response = await client.delete<TeamResponse>(`/teams/${teamId}/members/${userId}`);
    return response.data;
  },
};

// ==================== REQUESTS ENDPOINTS ====================

export const requestsAPI = {
  create: async (data: RequestCreate): Promise<RequestResponse> => {
    const response = await client.post<RequestResponse>('/requests', data);
    return response.data;
  },

  getIncoming: async (params?: {
    status?: string;
    skip?: number;
    limit?: number;
  }): Promise<RequestResponse[]> => {
    const response = await client.get<RequestResponse[]>('/requests/incoming', { params });
    return response.data;
  },

  getOutgoing: async (params?: {
    status?: string;
    skip?: number;
    limit?: number;
  }): Promise<RequestResponse[]> => {
    const response = await client.get<RequestResponse[]>('/requests/outgoing', { params });
    return response.data;
  },

  accept: async (requestId: number): Promise<RequestResponse> => {
    const response = await client.put<RequestResponse>(`/requests/${requestId}/accept`);
    return response.data;
  },

  decline: async (requestId: number): Promise<RequestResponse> => {
    const response = await client.put<RequestResponse>(`/requests/${requestId}/decline`);
    return response.data;
  },

  cancel: async (requestId: number): Promise<RequestResponse> => {
    const response = await client.delete<RequestResponse>(`/requests/${requestId}`);
    return response.data;
  },
};

// ==================== RECOMMENDATIONS ENDPOINTS ====================

export const recommendationsAPI = {
  getRecommendations: async (data: RecommendationRequest): Promise<RecommendationResponse> => {
    const response = await client.post<RecommendationResponse>('/recommendations', data);
    return response.data;
  },

  getTeamRecommendations: async (
    teamId: number,
    data: RecommendationRequest
  ): Promise<RecommendationResponse> => {
    const response = await client.post<RecommendationResponse>(
      `/recommendations/teams/${teamId}`,
      data
    );
    return response.data;
  },

  getStats: async (): Promise<any> => {
    const response = await client.get('/recommendations/stats');
    return response.data;
  },
};

// ==================== HACKATHONS ENDPOINTS ====================

export const hackathomsAPI = {
  getList: async (params?: {
    skip?: number;
    limit?: number;
    is_active?: boolean;
  }): Promise<HackathonResponse[]> => {
    const response = await client.get<HackathonResponse[]>('/hackathons', { params });
    return response.data;
  },

  getOne: async (hackathonId: number): Promise<HackathonResponse> => {
    const response = await client.get<HackathonResponse>(`/hackathons/${hackathonId}`);
    return response.data;
  },

  getCalendar: async () => {
    const response = await client.get('/hackathons/calendar');
    return response.data;
  },

  getNotification: async () => {
    const response = await client.get('/hackathons/notification');
    return response.data;
  },
};

// ==================== EXPORT ALL APIS ====================

export default {
  auth: authAPI,
  users: usersAPI,
  teams: teamsAPI,
  requests: requestsAPI,
  recommendations: recommendationsAPI,
  hackathons: hackathomsAPI,
};
