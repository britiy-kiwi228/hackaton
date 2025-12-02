from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional

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
