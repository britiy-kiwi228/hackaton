"""
Утилиты аутентификации (УСТАРЕВШИЙ МОДУЛЬ - использовать app.core.security)

Этот модуль оставлен для обратной совместимости.
Новый код должен использовать app.core.security и app.dependencies.auth
"""
import warnings
from datetime import timedelta
from typing import Dict, Any, Optional

from app.core.security import create_access_token as new_create_access_token
from app.core.security import decode_access_token as new_decode_access_token
from app.core.config import settings

# Для обратной совместимости
SECRET_KEY = settings.JWT_SECRET_KEY
ALGORITHM = settings.JWT_ALGORITHM
ACCESS_TOKEN_EXPIRE_MINUTES = settings.ACCESS_TOKEN_EXPIRE_MINUTES


def create_access_token(data: Dict[str, Any], expires_delta: timedelta = None) -> str:
    """
    [УСТАРЕЛО] Создать JWT токен (используйте app.core.security.create_access_token)
    """
    warnings.warn(
        "app.utils.auth.create_access_token is deprecated, use app.core.security.create_access_token",
        DeprecationWarning,
        stacklevel=2
    )
    subject = data.get("sub", "unknown")
    extra_claims = {k: v for k, v in data.items() if k != "sub"}
    return new_create_access_token(
        subject=subject,
        expires_delta=expires_delta,
        extra_claims=extra_claims
    )


def verify_access_token(token: str) -> Optional[Dict[str, Any]]:
    """
    [УСТАРЕЛО] Проверить JWT токен (используйте app.core.security.decode_access_token)
    """
    warnings.warn(
        "app.utils.auth.verify_access_token is deprecated, use app.core.security.decode_access_token",
        DeprecationWarning,
        stacklevel=2
    )
    try:
        return new_decode_access_token(token)
    except Exception:
        return None