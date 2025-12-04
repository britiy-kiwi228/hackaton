"""
Конфигурация приложения
"""
from pydantic_settings import BaseSettings
from pydantic import field_validator, ConfigDict
from datetime import timedelta
import base64
import re


class Settings(BaseSettings):
    """Настройки приложения"""
    
    model_config = ConfigDict(
        case_sensitive=True,
        env_file=".env"
    )
    
    # JWT
    JWT_SECRET_KEY: str = "OEhrg/w+8axaPc61QmU1eeFkhTDHEaqSEQjfIlJ208W1CBji60V2jfRKgwM8uJ2AZEyfgx1XQIn7V2R90SObBA=="
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 часа
    
    @field_validator('JWT_SECRET_KEY')
    @classmethod
    def validate_jwt_secret_key(cls, v):
        """Валидация JWT секрета для обеспечения безопасности"""
        if len(v) < 32:
            raise ValueError("JWT_SECRET_KEY должен быть не менее 32 символов")
        
        # Проверяем, что это не дефолтный небезопасный ключ
        unsafe_patterns = [
            "your_secret_key",
            "hackathon_secret_key",
            "change_in_production",
            "super_secret_key",
            "test_secret"
        ]
        
        v_lower = v.lower()
        for pattern in unsafe_patterns:
            if pattern in v_lower:
                raise ValueError(f"JWT_SECRET_KEY содержит небезопасный паттерн: {pattern}")
        
        # Проверяем энтропию - если это base64, то должно быть достаточно случайным
        try:
            decoded = base64.b64decode(v)
            if len(decoded) < 32:  # Минимум 256 бит энтропии
                raise ValueError("JWT_SECRET_KEY имеет недостаточную энтропию (минимум 32 байта в base64)")
        except:
            # Если не base64, проверяем длину и разнообразие символов
            if len(set(v)) < 16:  # Минимум 16 уникальных символов
                raise ValueError("JWT_SECRET_KEY имеет недостаточное разнообразие символов")
        
        return v
    
    # Telegram
    TELEGRAM_BOT_TOKEN: str = "YOUR_BOT_TOKEN_HERE"  # Нужно установить в .env
    TELEGRAM_AUTH_TTL_SECONDS: int = 3600  # 1 час


settings = Settings()
ACCESS_TOKEN_EXPIRE_DELTA = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)