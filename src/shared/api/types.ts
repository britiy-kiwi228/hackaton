// ==================== ENUMS ====================

export enum RoleEnum {
  BACKEND = 'backend',
  FRONTEND = 'frontend',
  DESIGN = 'design',
  PM = 'pm',
  ANALYST = 'analyst',
}

export enum RequestTypeEnum {
  JOIN_TEAM = 'join_team',
  COLLABORATE = 'collaborate',
  INVITE = 'invite',
}

export enum RequestStatusEnum {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  DECLINED = 'declined',
  CANCELED = 'canceled',
}

// ==================== USER TYPES ====================

export interface Skill {
  id: number;
  name: string;
}

export interface Achievement {
  id: number;
  hackathon_name: string;
  place: number | null;
  team_name: string;
  project_link: string | null;
  year: number;
  description: string;
}

export interface UserResponse {
  id: number;
  tg_id: number;
  username: string | null;
  full_name: string;
  bio: string;
  main_role: RoleEnum | null;
  ready_to_work: boolean;
  team_id: number | null;
  created_at: string; // ISO datetime
  skills: Skill[];
  achievements: Achievement[];
}

export interface UserListResponse {
  id: number;
  tg_id: number;
  username: string | null;
  full_name: string;
  main_role: RoleEnum | null;
  team_id: number | null;
}

export interface UserUpdate {
  bio?: string;
  main_role?: RoleEnum;
  ready_to_work?: boolean;
  skills?: string[];
}

// ==================== HACKATHON TYPES ====================

export interface HackathonResponse {
  id: number;
  title: string;
  description: string;
  start_date: string; // ISO datetime
  end_date: string; // ISO datetime
  registration_deadline: string; // ISO datetime
  logo_url: string | null;
  location: string;
  is_active: boolean;
  created_at: string; // ISO datetime
}

export interface CalendarResponse {
  upcoming: HackathonResponse[];
  history: HackathonResponse[];
}

export interface NotificationResponse {
  has_notification: boolean;
  message: string | null;
  hackathon_id: number | null;
}

// ==================== TEAM TYPES ====================

export interface TeamResponse {
  id: number;
  name: string;
  description: string;
  hackathon_id: number;
  captain_id: number;
  is_looking: boolean;
  created_at: string; // ISO datetime
  captain?: UserResponse | null;
  members: UserResponse[];
}

export interface TeamListResponse {
  id: number;
  name: string;
  hackathon_id: number;
  captain_id: number;
  is_looking: boolean;
}

export interface TeamCreate {
  name: string;
  description?: string;
  hackathon_id: number;
}

export interface TeamUpdate {
  name?: string;
  description?: string;
  is_looking?: boolean;
}

// ==================== REQUEST TYPES ====================

export interface TeamRequestResponse {
  id: number;
  user_id: number;
  team_id: number;
  is_invite: boolean;
  status: RequestStatusEnum;
  created_at: string; // ISO datetime
  user?: UserListResponse | null;
}

export interface RequestCreate {
  receiver_id?: number;
  team_id?: number;
  hackathon_id: number;
  request_type: RequestTypeEnum;
}

export interface RequestUpdate {
  status?: RequestStatusEnum;
}

export interface RequestResponse {
  id: number;
  sender_id: number;
  receiver_id: number | null;
  team_id: number | null;
  request_type: RequestTypeEnum;
  status: RequestStatusEnum;
  hackathon_id: number;
  created_at: string; // ISO datetime
  sender?: UserResponse | null;
  receiver?: UserResponse | null;
  team?: TeamResponse | null;
}

// ==================== RECOMMENDATIONS TYPES ====================

export interface EnhancedRecommendation {
  recommended_user?: UserResponse | null;
  recommended_team?: TeamListResponse | null;
  compatibility_score: number; // 0.0 - 1.0
  match_reasons: string[];
}

export interface RecommendationResponse {
  recommendations: EnhancedRecommendation[];
  total_found: number;
}

export interface RecommendationRequest {
  for_what: 'team' | 'user';
  preferred_roles?: string[];
  preferred_skills?: string[];
  exclude_team_ids?: number[];
  exclude_user_ids?: number[];
  hackathon_id: number;
  max_results?: number;
  min_score?: number;
}

// ==================== AUTH TYPES ====================

export interface TelegramAuthRequest {
  auth_data: Record<string, string>;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

// ==================== API RESPONSE TYPES ====================

export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
}
