#!/usr/bin/env python3
"""
Тест валидации JWT секрета
"""
import os
import tempfile
from pydantic import ValidationError

def test_jwt_validation():
    """Тестирует валидацию JWT секрета"""
    print("=== ТЕСТ ВАЛИДАЦИИ JWT СЕКРЕТА ===")
    
    # Тест 1: Слишком короткий секрет
    print("\n1. Тест короткого секрета...")
    try:
        os.environ["JWT_SECRET_KEY"] = "short"
        from app.core.config import Settings
        Settings()
        print("[ERROR] Короткий секрет не был отклонен!")
    except ValidationError as e:
        print("[OK] Короткий секрет корректно отклонен")
        print(f"   Ошибка: {e}")
    
    # Тест 2: Небезопасный паттерн
    print("\n2. Тест небезопасного паттерна...")
    try:
        os.environ["JWT_SECRET_KEY"] = "your_secret_key_here_very_long_but_unsafe"
        from importlib import reload
        import app.core.config
        reload(app.core.config)
        print("[ERROR] Небезопасный паттерн не был отклонен!")
    except ValidationError as e:
        print("[OK] Небезопасный паттерн корректно отклонен")
        print(f"   Ошибка: {e}")
    
    # Тест 3: Валидный base64 секрет
    print("\n3. Тест валидного base64 секрета...")
    try:
        os.environ["JWT_SECRET_KEY"] = "OEhrg/w+8axaPc61QmU1eeFkhTDHEaqSEQjfIlJ208W1CBji60V2jfRKgwM8uJ2AZEyfgx1XQIn7V2R90SObBA=="
        import app.core.config
        reload(app.core.config)
        settings = app.core.config.Settings()
        print("[OK] Валидный base64 секрет принят")
        print(f"   Длина: {len(settings.JWT_SECRET_KEY)} символов")
    except ValidationError as e:
        print(f"[ERROR] Валидный секрет отклонен: {e}")
    except Exception as e:
        print(f"[ERROR] Неожиданная ошибка: {e}")
    
    # Очищаем переменную окружения
    if "JWT_SECRET_KEY" in os.environ:
        del os.environ["JWT_SECRET_KEY"]
    
    print("\n=== ТЕСТ ВАЛИДАЦИИ ЗАВЕРШЕН ===")

if __name__ == "__main__":
    test_jwt_validation()