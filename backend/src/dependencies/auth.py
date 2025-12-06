"""
Зависимости FastAPI для аутентификации
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
        # Вызывающий код вернёт 401
        return None


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    """
    Получить текущего пользователя из JWT токена
    
    Args:
        token: JWT токен из заголовка Authorization
        db: сессия БД
    
    Returns:
        User: объект пользователя
    
    Raises:
        HTTPException: 401 если токен невалидный или пользователь не найден
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = decode_access_token(token)
        sub = payload.get("sub")
        if sub is None:
            raise credentials_exception
        user_id = int(sub)
    except (JWTError, ValueError, KeyError):
        # Любые ошибки декодирования токена → 401
        raise credentials_exception
    
    user: Optional[User] = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise credentials_exception
    
    return user


async def get_current_admin_user(
    current_user: User = Depends(get_current_user),
) -> User:
    """
    Получить текущего пользователя и проверить, что он админ
    
    Args:
        current_user: текущий пользователь из JWT
    
    Returns:
        User: объект пользователя-админа
    
    Raises:
        HTTPException: 403 если пользователь не админ
    """
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    return current_user