"""
Утилиты для работы с Telegram авторизацией
"""
import hmac
import hashlib
from datetime import datetime, timezone
from typing import Mapping, Any

from app.core.config import settings


def _bot_token_hmac_key() -> bytes:
    """
    Получить HMAC ключ из токена бота
    
    Telegram рекомендует использовать SHA256 от токена бота
    
    Returns:
        bytes: HMAC ключ
    """
    return hashlib.sha256(settings.TELEGRAM_BOT_TOKEN.encode("utf-8")).digest()


def verify_telegram_auth(auth_data: Mapping[str, Any], ttl_seconds: int) -> None:
    """
    Проверить подлинность данных авторизации Telegram
    
    Args:
        auth_data: данные от Telegram Login Widget
        ttl_seconds: максимальный возраст данных в секундах
    
    Raises:
        ValueError: если данные невалидные или истекли
    """
    # 1) Проверка auth_date
    auth_date_raw = auth_data.get("auth_date")
    try:
        auth_date = int(auth_date_raw)
    except (TypeError, ValueError):
        raise ValueError("Invalid auth_date")
    
    now = int(datetime.now(timezone.utc).timestamp())
    if abs(now - auth_date) > ttl_seconds:
        raise ValueError("Authentication data expired")
    
    # 2) Проверка подписи
    received_hash = auth_data.get("hash", "")
    if not received_hash:
        raise ValueError("Missing signature")
    
    # Собираем data-check-string по правилам Telegram
    items = []
    for k, v in auth_data.items():
        if k == "hash" or v is None:
            continue
        items.append((k, str(v)))
    items.sort(key=lambda kv: kv[0])
    data_check_string = "\n".join(f"{k}={v}" for k, v in items)
    
    secret_key = _bot_token_hmac_key()
    calculated_hash = hmac.new(
        secret_key,
        data_check_string.encode("utf-8"),
        hashlib.sha256
    ).hexdigest()
    
    if calculated_hash != received_hash:
        raise ValueError("Invalid Telegram signature")