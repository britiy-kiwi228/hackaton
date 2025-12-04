"""
Централизованный модуль авторизации для FastAPI приложения.
Объединяет все функции аутентификации и авторизации.
"""
from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from jose import JWTError

from app.database import get_db
from app.models import User
from app.core.security import verify_password, decode_access_token

# OAuth2 схема для получения токена из заголовка Authorization: Bearer <token>
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


async def authenticate_user(email: str, password: str, db: Session) -> Optional[User]:
    """
    Аутентифицировать пользователя по email и паролю
    
    Args:
        email: email пользователя
        password: пароль в открытом виде
        db: сессия БД
    
    Returns:
        User: объект пользователя или None если креды неверные
    """
    try:
        user: Optional[User] = db.query(User).filter(User.email == email).first()
        if not user or not user.password_hash:
            return None
        if not verify_password(password, user.password_hash):
            return None
        return user
    except Exception:
        # Не раскрываем детали ошибок БД/хеширования - возвращаем None
        return None


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    """
    Получить текущего пользователя из JWT токена (Bearer token из заголовка Authorization)
    
    Args:
        token: JWT токен из заголовка Authorization: Bearer <token>
        db: сессия БД (dependency injection)
    
    Returns:
        User: объект пользователя из БД
    
    Raises:
        HTTPException 401: если токен невалидный или пользователь не найден
    
    Example: