"""
Core модуль приложения: конфигурация, безопасность, авторизация
"""
from app.core.config import settings
from app.core.security import (
    create_access_token,
    decode_access_token,
    get_password_hash,
    verify_password,
)
from app.core.auth import (
    get_current_user,
    get_current_admin_user,
    get_current_active_user,
    authenticate_user,
)

__all__ = [
    "settings",
    "create_access_token",
    "decode_access_token",
    "get_password_hash",
    "verify_password",
    "get_current_user",
    "get_current_admin_user",
    "get_current_active_user",
    "authenticate_user",
]