"""
Модуль безопасности: хеширование паролей и JWT токены
"""
from datetime import datetime, timedelta, timezone
from typing import Optional, Any, Dict

from jose import jwt, JWTError
from passlib.context import CryptContext

from app.core.config import settings, ACCESS_TOKEN_EXPIRE_DELTA

# Контекст для хеширования паролей через bcrypt
pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto",
)


def verify_password(plain_password: str, password_hash: str) -> bool:
    """
    Проверить пароль против хеша
    
    Args:
        plain_password: пароль в открытом виде
        password_hash: хеш пароля из БД
    
    Returns:
        bool: True если пароль верный
    """
    return pwd_context.verify(plain_password, password_hash)


def get_password_hash(password: str) -> str:
    """
    Получить bcrypt хеш пароля
    
    Args:
        password: пароль в открытом виде
    
    Returns:
        str: хеш пароля для хранения в БД
    """
    return pwd_context.hash(password)


def create_access_token(
    subject: str | int,
    expires_delta: Optional[timedelta] = None,
    extra_claims: Optional[Dict[str, Any]] = None,
) -> str:
    """
    Создать JWT access token
    
    Args:
        subject: user_id (будет в поле 'sub')
        expires_delta: время жизни токена (по умолчанию из настроек)
        extra_claims: дополнительные данные в токен (роль, права и т.д.)
    
    Returns:
        str: JWT токен
    """
    to_encode: Dict[str, Any] = {}
    if extra_claims:
        to_encode.update(extra_claims)
    
    now = datetime.now(timezone.utc)
    expire = now + (expires_delta or ACCESS_TOKEN_EXPIRE_DELTA)
    
    # Стандартные JWT claims
    to_encode.update({
        "sub": str(subject),
        "iat": int(now.timestamp()),
        "nbf": int(now.timestamp()),
        "exp": int(expire.timestamp()),
    })
    
    encoded_jwt = jwt.encode(
        to_encode,
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM
    )
    return encoded_jwt


def decode_access_token(token: str) -> Dict[str, Any]:
    """
    Декодировать и проверить JWT токен
    
    Args:
        token: JWT токен
    
    Returns:
        Dict: payload токена
    
    Raises:
        JWTError: если токен невалидный/истёк
    """
    return jwt.decode(
        token,
        settings.JWT_SECRET_KEY,
        algorithms=[settings.JWT_ALGORITHM]
    )