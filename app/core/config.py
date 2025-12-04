"""
Конфигурация приложения
"""
from pydantic_settings import BaseSettings
from datetime import timedelta


class Settings(BaseSettings):
    """Настройки приложения"""
    
    # JWT
    JWT_SECRET_KEY: str = "hackathon_secret_key_2024_super_secure_change_in_production_min_32_chars_required"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 часа
    
    # Telegram
    TELEGRAM_BOT_TOKEN: str = "YOUR_BOT_TOKEN_HERE"  # Нужно установить в .env
    TELEGRAM_AUTH_TTL_SECONDS: int = 3600  # 1 час
    
    class Config:
        case_sensitive = True
        env_file = ".env"


settings = Settings()
ACCESS_TOKEN_EXPIRE_DELTA = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)