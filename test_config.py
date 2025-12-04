#!/usr/bin/env python3
"""
Тест конфигурации JWT секрета
"""
from app.core.config import settings
import base64

def test_jwt_config():
    """Тестирует конфигурацию JWT"""
    print("=== ТЕСТ КОНФИГУРАЦИИ JWT ===")
    
    # Проверяем загрузку настроек
    print(f"[OK] Конфигурация загружена успешно")
    print(f"JWT_SECRET_KEY длина: {len(settings.JWT_SECRET_KEY)} символов")
    print(f"JWT_ALGORITHM: {settings.JWT_ALGORITHM}")
    print(f"ACCESS_TOKEN_EXPIRE_MINUTES: {settings.ACCESS_TOKEN_EXPIRE_MINUTES}")
    
    # Проверяем валидацию
    try:
        # Проверяем, что секрет base64
        decoded = base64.b64decode(settings.JWT_SECRET_KEY)
        print(f"[OK] JWT секрет является валидным base64")
        print(f"Декодированная длина: {len(decoded)} байт")
        print(f"Энтропия: {len(decoded) * 8} бит")
    except Exception as e:
        print(f"[ERROR] Ошибка декодирования base64: {e}")
    
    # Проверяем минимальные требования безопасности
    if len(settings.JWT_SECRET_KEY) >= 32:
        print("[OK] JWT секрет соответствует минимальной длине")
    else:
        print("[ERROR] JWT секрет слишком короткий")
    
    print("=== ТЕСТ ЗАВЕРШЕН ===")

if __name__ == "__main__":
    test_jwt_config()