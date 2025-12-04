from pydantic import BaseModel, EmailStr, validator
from datetime import datetime
from typing import Optional, List, Dict, Any
from enum import Enum

# Импортируем Enum Role из моделей (для использования в схемах)
class RoleEnum(str, Enum):
    """Роли участников"""
    backend = "backend"
    frontend = "frontend"
    design = "design"
    pm = "pm"
    analyst = "analyst"


# ==================== USER СХЕМЫ ====================

class SkillBase(BaseModel):
    name: str


class SkillResponse(BaseModel):
    id: int
    name: str
    
    class Config:
        from_attributes = True


class AchievementBase(BaseModel):
    name: str
    description: str
    icon_url: Optional[str] = None


class AchievementResponse(AchievementBase):
    id: int
    unlocked_at: datetime
    
    class Config:
        from_attributes = True


class HackathonParticipationBase(BaseModel):
    hackathon_id: int
    place: Optional[int]
    team_name: str
    project_link: Optional[str]
    year: int
    description: str


class HackathonParticipationResponse(HackathonParticipationBase):
    id: int
    
    class Config:
        from_attributes = True


class UserBase(BaseModel):
    """Базовая информация о пользователе"""
    full_name: str
    username: Optional[str] = None
    bio: Optional[str] = ""
    main_role: Optional[RoleEnum] = None
    ready_to_work: bool = True


class UserUpdate(BaseModel):
    """Обновление профиля"""
    full_name: Optional[str] = None
    username: Optional[str] = None
    bio: Optional[str] = None
    main_role: Optional[RoleEnum] = None
    ready_to_work: Optional[bool] = None
    team_id: Optional[int] = None
    skills: Optional[List[str]] = None
    avatar_url: Optional[str] = None
    tg_username: Optional[str] = None
    hide_tg_username: Optional[bool] = None


class UserLogin(BaseModel):
    """Авторизация через Telegram"""
    tg_id: int
    username: Optional[str] = None
    full_name: Optional[str] = None


class UserResponse(BaseModel):
    """Полный профиль пользователя"""
    id: int
    tg_id: Optional[int] = None
    username: Optional[str] = None
    full_name: str
    bio: str
    main_role: Optional[str] = None
    ready_to_work: bool
    team_id: Optional[int] = None
    created_at: datetime
    avatar_url: Optional[str] = None
    tg_username: Optional[str] = None

    skills: List[SkillResponse] = []
    achievements: List[AchievementResponse] = []
    participations: List[HackathonParticipationResponse] = []

    class Config:
        from_attributes = True


class UserListResponse(BaseModel):
    users: List[UserResponse]


# ==================== HACKATHON СХЕМЫ ====================

class HackathonBase(BaseModel):
    title: str
    description: str
    start_date: datetime
    end_date: datetime
    registration_deadline: datetime


class HackathonCreate(HackathonBase):
    pass


class HackathonUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    registration_deadline: Optional[datetime] = None
    is_active: Optional[bool] = None


class HackathonResponse(HackathonBase):
    id: int
    is_active: bool

    class Config:
        from_attributes = True


class HackathonListResponse(BaseModel):
    hackathons: List[HackathonResponse]


# ==================== TEAM СХЕМЫ ====================

class TeamBase(BaseModel):
    name: str
    description: Optional[str] = ""


class TeamCreate(BaseModel):
    name: str
    description: Optional[str] = ""
    hackathon_id: int


class TeamUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    is_looking: Optional[bool] = None


# Forward reference для циклических зависимостей
class TeamResponse(BaseModel):
    id: int
    name: str
    description: str
    captain_id: int
    hackathon_id: int
    is_looking: bool = True
    created_at: datetime

    members: List[UserResponse] = []
    requests: List['JoinRequestResponse'] = []

    class Config:
        from_attributes = True


class TeamListResponse(BaseModel):
    """Упрощённый список команд (без вложенных объектов)"""
    id: int
    name: str
    description: str
    captain_id: int
    hackathon_id: int
    is_looking: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


# ==================== REQUEST ENUMS ====================

class RequestStatusEnum(str, Enum):
    """Статусы запросов"""
    pending = "pending"
    accepted = "accepted"
    declined = "declined"
    canceled = "canceled"


class RequestTypeEnum(str, Enum):
    """Типы запросов"""
    join_team = "join_team"
    collaborate = "collaborate"


# ==================== REQUESTS ====================

class RequestCreate(BaseModel):
    """Создание запроса"""
    receiver_id: Optional[int] = None
    team_id: Optional[int] = None
    hackathon_id: int
    request_type: RequestTypeEnum


class RequestUpdate(BaseModel):
    """Обновление запроса"""
    status: RequestStatusEnum


class RequestResponse(BaseModel):
    """Ответ с данными запроса"""
    id: int
    sender_id: int
    receiver_id: Optional[int] = None
    team_id: Optional[int] = None
    hackathon_id: int
    request_type: str
    status: str
    created_at: datetime
    sender: Optional[UserResponse] = None
    receiver: Optional[UserResponse] = None
    team: Optional['TeamResponse'] = None
    hackathon: Optional['HackathonResponse'] = None

    class Config:
        from_attributes = True


# ==================== JOIN REQUESTS ====================

class JoinRequestBase(BaseModel):
    user_id: int
    team_id: int


class JoinRequestCreate(BaseModel):
    """Создание запроса на вступление"""
    team_id: int


class JoinRequestResponse(BaseModel):
    id: int
    team_id: int
    user_id: int
    status: str
    created_at: datetime
    user: Optional[UserResponse] = None

    class Config:
        from_attributes = True


# Алиасы для обратной совместимости
TeamRequestCreate = JoinRequestCreate
TeamRequestResponse = JoinRequestResponse


# ==================== RECOMMENDATIONS ====================

class RecommendationRequest(BaseModel):
    """Запрос рекомендаций"""
    hackathon_id: int
    for_what: str  # "team" или "user"
    preferred_roles: Optional[List[RoleEnum]] = None
    preferred_skills: Optional[List[str]] = None
    exclude_team_ids: Optional[List[int]] = None
    exclude_user_ids: Optional[List[int]] = None


class UserWithScore(BaseModel):
    user: UserResponse
    score: float


class TeamWithScore(BaseModel):
    team: TeamResponse
    score: float


class RecommendationResponse(BaseModel):
    """Рекомендации для пользователя"""
    recommended_users: List[UserWithScore]
    recommended_teams: List[TeamWithScore]


# ==================== ФИЛЬТРЫ ДЛЯ ПОИСКА ====================

class UserFilter(BaseModel):
    """Фильтрация пользователей"""
    roles: Optional[List[RoleEnum]] = None
    skills: Optional[List[str]] = None
    ready_to_work: Optional[bool] = None


class TeamFilter(BaseModel):
    """Фильтрация команд"""
    hackathon_id: Optional[int] = None
    roles_needed: Optional[List[RoleEnum]] = None
    require_free_slots: Optional[bool] = None


# ==================== РАСШИРЕННЫЕ РЕКОМЕНДАЦИИ ====================

class EnhancedRecommendation(BaseModel):
    """Расширенные рекомендации (для будущего AI алгоритма)"""
    user_matches: Dict[int, float]
    team_matches: Dict[int, float]
    common_skills: Dict[int, List[str]]
    reasons: Dict[str, float]


# ==================== TELEGRAM AUTH ====================

class TelegramAuthRequest(BaseModel):
    """Запрос авторизации через Telegram Login Widget"""
    auth_data: Dict[str, Any]


# ==================== EMAIL/PASSWORD AUTH ====================

class UserCreateRequest(BaseModel):
    """Создание пользователя с email/password"""
    email: EmailStr
    password: str
    full_name: str
    
    @validator('password')
    def validate_password_length(cls, v):
        if len(v.encode('utf-8')) > 72:
            raise ValueError('Password cannot be longer than 72 bytes')
        return v


class UserLoginRequest(BaseModel):
    """Вход по email/password"""
    email: EmailStr
    password: str
    
    @validator('password')
    def validate_password_length(cls, v):
        if len(v.encode('utf-8')) > 72:
            raise ValueError('Password cannot be longer than 72 bytes')
        return v


# ==================== TOKEN ====================

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


# ==================== CALENDAR & NOTIFICATIONS ====================

class CalendarResponse(BaseModel):
    """Ответ для календаря хакатонов"""
    upcoming: List[HackathonResponse]
    history: List[HackathonResponse]


class NotificationResponse(BaseModel):
    """Ответ с уведомлением о ближайшем хакатоне"""
    has_notification: bool
    message: Optional[str] = None
    hackathon_id: Optional[int] = None


# Обновляем forward references
TeamResponse.model_rebuild()
JoinRequestResponse.model_rebuild()
