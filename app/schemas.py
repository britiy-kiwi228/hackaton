from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional, List

class UserCreate(BaseModel):
    """Модель для создания пользователя"""
    name: str
    email: EmailStr

class UserResponse(BaseModel):
    """Модель ответа пользователя"""
    id: int
    name: str
    email: str
    created_at: datetime
    
    class Config:
        from_attributes = True  # Работает с SQLAlchemy моделями


# ==================== HACKATHON СХЕМЫ ====================

class HackathonCreate(BaseModel):
    """Схема для создания нового хакатона"""
    title: str
    description: str
    start_date: datetime
    end_date: datetime
    registration_deadline: datetime
    logo_url: Optional[str] = None
    location: str
    is_active: bool = True


class HackathonUpdate(BaseModel):
    """Схема для обновления хакатона"""
    title: Optional[str] = None
    description: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    registration_deadline: Optional[datetime] = None
    logo_url: Optional[str] = None
    location: Optional[str] = None
    is_active: Optional[bool] = None


class HackathonResponse(BaseModel):
    """Модель для ответа с информацией о хакатоне"""
    id: int
    title: str
    description: str
    start_date: datetime
    end_date: datetime
    registration_deadline: datetime
    logo_url: Optional[str]
    location: str
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


class CalendarResponse(BaseModel):
    """Ответ для календаря хакатонов"""
    upcoming: List[HackathonResponse]
    history: List[HackathonResponse]


class NotificationResponse(BaseModel):
    """Ответ с уведомлением о ближайшем хакатоне"""
    has_notification: bool
    message: Optional[str] = None
    hackathon_id: Optional[int] = None
