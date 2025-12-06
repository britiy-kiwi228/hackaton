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
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = decode_access_token(token)
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = db.query(User).filter(User.id == int(user_id)).first()
    if user is None:
        raise credentials_exception
    
    return user


async def get_current_admin_user(
    current_user: User = Depends(get_current_user),
) -> User:
    """
    Получить текущего пользователя с правами администратора
    
    Args:
        current_user: текущий пользователь (dependency injection)
    
    Returns:
        User: объект пользователя-администратора
    
    Raises:
        HTTPException 403: если пользователь не является администратором
    """
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    return current_user


async def get_current_active_user(
    current_user: User = Depends(get_current_user),
) -> User:
    """
    Получить текущего активного пользователя
    
    Args:
        current_user: текущий пользователь (dependency injection)
    
    Returns:
        User: объект активного пользователя
    
    Raises:
        HTTPException 400: если пользователь неактивен
    """
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )
    return current_user