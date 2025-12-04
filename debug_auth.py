"""
Debug скрипт для тестирования всех сценариев аутентификации

Запуск: python debug_auth.py
"""
import sys
import os
from datetime import datetime, timezone
import hmac
import hashlib
import json

# Добавляем корневую директорию в путь для импортов
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

print("=" * 80)
print("🔐 DEBUG AUTH SCRIPT - Проверка системы аутентификации")
print("=" * 80)
print()

# Импортируем приложение
try:
    from main import app
    print("✓ FastAPI приложение импортировано")
except Exception as e:
    print(f"✗ ОШИБКА импорта приложения: {e}")
    sys.exit(1)

# Импортируем модели и утилиты
try:
    from app.database import SessionLocal, engine, Base
    from app.models import User
    from app.core.security import get_password_hash, verify_password
    from app.core.config import settings
    print("✓ Модули БД и безопасности импортированы")
except Exception as e:
    print(f"✗ ОШИБКА импорта модулей: {e}")
    sys.exit(1)

# Создаём таблицы
try:
    Base.metadata.create_all(bind=engine)
    print("✓ Таблицы БД созданы/проверены")
except Exception as e:
    print(f"✗ ОШИБКА создания таблиц: {e}")

print()
print("-" * 80)
print("📊 ПОДГОТОВКА ТЕСТОВЫХ ДАННЫХ")
print("-" * 80)

# Создаём тестового админа
TEST_ADMIN_EMAIL = "admin@hackathon.test"
TEST_ADMIN_PASSWORD = "admin123"

db: Session = SessionLocal()

try:
    # Проверяем, есть ли уже тестовый админ
    admin_user = db.query(User).filter(User.email == TEST_ADMIN_EMAIL).first()
    
    if admin_user:
        print(f"✓ Тестовый админ уже существует: {TEST_ADMIN_EMAIL}")
        print(f"  User ID: {admin_user.id}")
        print(f"  Is Admin: {admin_user.is_admin}")
        print(f"  Password Hash: {admin_user.password_hash[:50]}...")
    else:
        # Создаём нового админа
        password_hash = get_password_hash(TEST_ADMIN_PASSWORD)
        admin_user = User(
            email=TEST_ADMIN_EMAIL,
            password_hash=password_hash,
            full_name="Test Admin",
            username="testadmin",
            is_admin=True,
            ready_to_work=True,
        )
        db.add(admin_user)
        db.commit()
        db.refresh(admin_user)
        print(f"✓ Создан новый тестовый админ: {TEST_ADMIN_EMAIL}")
        print(f"  User ID: {admin_user.id}")
        print(f"  Password: {TEST_ADMIN_PASSWORD}")
        print(f"  Password Hash: {password_hash[:50]}...")
    
    # Проверяем корректность хеширования
    print()
    print("🔐 Проверка хеширования пароля:")
    is_valid = verify_password(TEST_ADMIN_PASSWORD, admin_user.password_hash)
    if is_valid:
        print(f"  ✓ Пароль '{TEST_ADMIN_PASSWORD}' корректно проверяется против хеша")
    else:
        print(f"  ✗ ОШИБКА: Пароль не проходит проверку!")
        print(f"    Это означает проблему в функции хеширования")

except Exception as e:
    print(f"✗ ОШИБКА при создании тестового админа: {e}")
    import traceback
    traceback.print_exc()
finally:
    db.close()

print()
print("-" * 80)
print("🧪 ТЕСТ 1: Email/Password Аутентификация (Админка)")
print("-" * 80)

client = TestClient(app)

# Тест 1.1: Корректные креды
print()
print("📝 Тест 1.1: Вход с корректными учётными данными")
print(f"   Email: {TEST_ADMIN_EMAIL}")
print(f"   Password: {TEST_ADMIN_PASSWORD}")

try:
    response = client.post(
        "/auth/login",
        data={
            "username": TEST_ADMIN_EMAIL,  # OAuth2PasswordRequestForm использует 'username'
            "password": TEST_ADMIN_PASSWORD,
        },
    )
    
    print(f"   Статус: {response.status_code}")
    print(f"   Тело ответа: {json.dumps(response.json(), indent=2, ensure_ascii=False)}")
    
    if response.status_code == 200:
        token = response.json().get("access_token")
        if token:
            print(f"   ✓ JWT токен получен: {token[:50]}...")
            
            # Проверяем токен через /auth/me
            print()
            print("   📝 Проверка токена через /auth/me")
            me_response = client.get(
                "/auth/me",
                headers={"Authorization": f"Bearer {token}"}
            )
            print(f"   Статус: {me_response.status_code}")
            print(f"   Данные пользователя: {json.dumps(me_response.json(), indent=2, ensure_ascii=False)}")
        else:
            print(f"   ✗ ОШИБКА: Токен не найден в ответе")
    else:
        print(f"   ✗ ОШИБКА: Неожиданный статус код")
        
except Exception as e:
    print(f"   ✗ ОШИБКА при запросе: {e}")
    import traceback
    traceback.print_exc()

# Тест 1.2: Неверный пароль
print()
print("📝 Тест 1.2: Вход с неверным паролем")
print(f"   Email: {TEST_ADMIN_EMAIL}")
print(f"   Password: wrong_password")

try:
    response = client.post(
        "/auth/login",
        data={
            "username": TEST_ADMIN_EMAIL,
            "password": "wrong_password",
        },
    )
    
    print(f"   Статус: {response.status_code}")
    print(f"   Тело ответа: {json.dumps(response.json(), indent=2, ensure_ascii=False)}")
    
    if response.status_code == 401:
        print(f"   ✓ Корректно возвращён 401 Unauthorized")
    else:
        print(f"   ✗ ОШИБКА: Ожидался 401, получен {response.status_code}")
        
except Exception as e:
    print(f"   ✗ ОШИБКА при запросе: {e}")

# Тест 1.3: Несуществующий email
print()
print("📝 Тест 1.3: Вход с несуществующим email")
print(f"   Email: nonexistent@test.com")
print(f"   Password: {TEST_ADMIN_PASSWORD}")

try:
    response = client.post(
        "/auth/login",
        data={
            "username": "nonexistent@test.com",
            "password": TEST_ADMIN_PASSWORD,
        },
    )
    
    print(f"   Статус: {response.status_code}")
    print(f"   Тело ответа: {json.dumps(response.json(), indent=2, ensure_ascii=False)}")
    
    if response.status_code == 401:
        print(f"   ✓ Корректно возвращён 401 Unauthorized")
    else:
        print(f"   ✗ ОШИБКА: Ожидался 401, получен {response.status_code}")
        
except Exception as e:
    print(f"   ✗ ОШИБКА при запросе: {e}")

print()
print("-" * 80)
print("🧪 ТЕСТ 2: Telegram Аутентификация")
print("-" * 80)

# Генерируем валидные Telegram данные
TEST_TG_ID = 123456789
TEST_TG_USERNAME = "test_user"
TEST_TG_FIRST_NAME = "Test"
TEST_TG_LAST_NAME = "User"

# Создаём auth_date (текущее время)
auth_date = int(datetime.now(timezone.utc).timestamp())

# Собираем данные
auth_data = {
    "id": str(TEST_TG_ID),
    "first_name": TEST_TG_FIRST_NAME,
    "last_name": TEST_TG_LAST_NAME,
    "username": TEST_TG_USERNAME,
    "auth_date": str(auth_date),
}

# Генерируем подпись
items = sorted([(k, v) for k, v in auth_data.items() if v is not None])
data_check_string = "\n".join([f"{k}={v}" for k, v in items])
secret_key = hashlib.sha256(settings.TELEGRAM_BOT_TOKEN.encode()).digest()
calculated_hash = hmac.new(secret_key, data_check_string.encode(), hashlib.sha256).hexdigest()

auth_data["hash"] = calculated_hash

print()
print("📝 Тест 2.1: Telegram вход с валидной подписью")
print(f"   TG ID: {TEST_TG_ID}")
print(f"   Username: {TEST_TG_USERNAME}")
print(f"   Auth Date: {auth_date}")
print(f"   Hash: {calculated_hash[:20]}...")

try:
    response = client.post(
        "/auth/telegram/login",
        json={"auth_data": auth_data},
    )
    
    print(f"   Статус: {response.status_code}")
    
    if response.status_code == 200:
        response_data = response.json()
        print(f"   Тело ответа: {json.dumps(response_data, indent=2, ensure_ascii=False)}")
        
        token = response_data.get("access_token")
        if token:
            print(f"   ✓ JWT токен получен: {token[:50]}...")
            
            # Проверяем созданного пользователя в БД
            db = SessionLocal()
            try:
                tg_user = db.query(User).filter(User.tg_id == TEST_TG_ID).first()
                if tg_user:
                    print()
                    print("   📊 Пользователь в БД:")
                    print(f"      ID: {tg_user.id}")
                    print(f"      TG ID: {tg_user.tg_id}")
                    print(f"      Username: {tg_user.username}")
                    print(f"      Full Name: {tg_user.full_name}")
                    print(f"      Is Admin: {tg_user.is_admin}")
                else:
                    print(f"   ✗ ОШИБКА: Пользователь не найден в БД")
            finally:
                db.close()
            
            # Проверяем токен через /auth/me
            print()
            print("   📝 Проверка токена через /auth/me")
            me_response = client.get(
                "/auth/me",
                headers={"Authorization": f"Bearer {token}"}
            )
            print(f"   Статус: {me_response.status_code}")
            if me_response.status_code == 200:
                print(f"   Данные пользователя: {json.dumps(me_response.json(), indent=2, ensure_ascii=False)}")
        else:
            print(f"   ✗ ОШИБКА: Токен не найден в ответе")
    else:
        print(f"   ✗ ОШИБКА: Неожиданный статус код")
        try:
            print(f"   Тело ответа: {json.dumps(response.json(), indent=2, ensure_ascii=False)}")
        except:
            print(f"   Тело ответа (raw): {response.text}")
        
except Exception as e:
    print(f"   ✗ ОШИБКА при запросе: {e}")
    import traceback
    traceback.print_exc()

# Тест 2.2: Невалидная подпись
print()
print("📝 Тест 2.2: Telegram вход с невалидной подписью")

invalid_auth_data = auth_data.copy()
invalid_auth_data["hash"] = "invalid_hash_123"

try:
    response = client.post(
        "/auth/telegram/login",
        json={"auth_data": invalid_auth_data},
    )
    
    print(f"   Статус: {response.status_code}")
    print(f"   Тело ответа: {json.dumps(response.json(), indent=2, ensure_ascii=False)}")
    
    if response.status_code == 401:
        print(f"   ✓ Корректно возвращён 401 Unauthorized")
    else:
        print(f"   ✗ ОШИБКА: Ожидался 401, получен {response.status_code}")
        
except Exception as e:
    print(f"   ✗ ОШИБКА при запросе: {e}")

# Тест 2.3: Истекший auth_date
print()
print("📝 Тест 2.3: Telegram вход с истекшим auth_date")

old_auth_date = auth_date - 7200  # 2 часа назад (TTL = 1 час)
old_auth_data = {
    "id": str(TEST_TG_ID),
    "first_name": TEST_TG_FIRST_NAME,
    "username": TEST_TG_USERNAME,
    "auth_date": str(old_auth_date),
}

# Генерируем правильную подпись для старых данных
items = sorted([(k, v) for k, v in old_auth_data.items()])
data_check_string = "\n".join([f"{k}={v}" for k, v in items])
old_hash = hmac.new(secret_key, data_check_string.encode(), hashlib.sha256).hexdigest()
old_auth_data["hash"] = old_hash

try:
    response = client.post(
        "/auth/telegram/login",
        json={"auth_data": old_auth_data},
    )
    
    print(f"   Статус: {response.status_code}")
    print(f"   Тело ответа: {json.dumps(response.json(), indent=2, ensure_ascii=False)}")
    
    if response.status_code == 401:
        print(f"   ✓ Корректно возвращён 401 Unauthorized (данные истекли)")
    else:
        print(f"   ✗ ОШИБКА: Ожидался 401, получен {response.status_code}")
        
except Exception as e:
    print(f"   ✗ ОШИБКА при запросе: {e}")

print()
print("=" * 80)
print("✅ ТЕСТИРОВАНИЕ ЗАВЕРШЕНО")
print("=" * 80)
print()
print("📋 РЕЗЮМЕ:")
print("   - Email/Password auth: проверен (логин, неверный пароль, несуществующий email)")
print("   - Telegram auth: проверен (валидная подпись, невалидная подпись, истекшие данные)")
print("   - JWT токены: проверены через /auth/me")
print("   - Обработка ошибок: проверена (401 для всех ошибок аутентификации)")
print()
print("💡 РЕКОМЕНДАЦИИ:")
print("   1. Установите правильный TELEGRAM_BOT_TOKEN в .env")
print("   2. В продакшене смените JWT_SECRET_KEY на случайную строку")
print("   3. Используйте HTTPS в продакшене для защиты токенов")
print()#!/usr/bin/env python3
"""
Debug Auth Script - Тестирование всех сценариев аутентификации
Автор: QA Automation Lead
Дата: 2025-12-04

Этот скрипт проверяет все сценарии входа в систему и показывает детальную информацию об ошибках.
"""

import sys
import os
import time
import hmac
import hashlib
import json
from typing import Dict, Any, Optional

# Добавляем путь к проекту для импорта модулей
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

# Импортируем приложение и зависимости
from main import app
from app.database import SessionLocal, engine, Base
from app.models import User
from app.utils.auth import SECRET_KEY, create_access_token
from app.schemas import TelegramAuthRequest

# Создаем тестовый клиент
client = TestClient(app)

# Константы для тестирования
TEST_USER_EMAIL = "admin@test.com"
TEST_USER_PASSWORD = "testpassword123"
TEST_TG_ID = 123456789
TEST_USERNAME = "testuser"
TEST_FIRST_NAME = "Test"
TEST_LAST_NAME = "User"

def print_separator(title: str):
    """Печатает красивый разделитель"""
    print("\n" + "="*60)
    print(f" {title}")
    print("="*60)

def print_step(step: str):
    """Печатает шаг тестирования"""
    print(f"\n🔍 {step}")

def print_success(message: str):
    """Печатает сообщение об успехе"""
    print(f"✅ {message}")

def print_error(message: str):
    """Печатает сообщение об ошибке"""
    print(f"❌ {message}")

def print_info(message: str):
    """Печатает информационное сообщение"""
    print(f"ℹ️  {message}")

def create_test_user_in_db() -> Optional[User]:
    """Создает тестового пользователя в БД или возвращает существующего"""
    print_step("Создание/проверка тестового пользователя в БД")
    
    db = SessionLocal()
    try:
        # Проверяем, есть ли уже пользователь с таким tg_id
        existing_user = db.query(User).filter(User.tg_id == TEST_TG_ID).first()
        
        if existing_user:
            print_info(f"Пользователь уже существует: ID={existing_user.id}, tg_id={existing_user.tg_id}")
            print_info(f"Username: {existing_user.username}, Full name: {existing_user.full_name}")
            return existing_user
        
        # Создаем нового пользователя
        new_user = User(
            tg_id=TEST_TG_ID,
            username=TEST_USERNAME,
            full_name=f"{TEST_FIRST_NAME} {TEST_LAST_NAME}",
            bio="Тестовый пользователь для отладки аутентификации",
            ready_to_work=True
        )
        
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        
        print_success(f"Создан новый пользователь: ID={new_user.id}, tg_id={new_user.tg_id}")
        return new_user
        
    except Exception as e:
        print_error(f"Ошибка при работе с БД: {e}")
        db.rollback()
        return None
    finally:
        db.close()

def generate_telegram_auth_data() -> Dict[str, str]:
    """Генерирует валидные данные для Telegram авторизации"""
    print_step("Генерация данных для Telegram авторизации")
    
    auth_data = {
        "id": str(TEST_TG_ID),
        "first_name": TEST_FIRST_NAME,
        "last_name": TEST_LAST_NAME,
        "username": TEST_USERNAME,
        "auth_date": str(int(time.time()))  # Текущее время
    }
    
    # Сортируем и формируем строку для hash
    sorted_items = sorted([(k, v) for k, v in auth_data.items() if v is not None])
    sorted_data = "\n".join([f"{k}={v}" for k, v in sorted_items])
    
    print_info(f"Данные для подписи: {sorted_data}")
    
    # Secret key для HMAC
    secret_key_hash = hashlib.sha256(SECRET_KEY.encode()).digest()
    
    # Вычисляем hash
    calculated_hash = hmac.new(secret_key_hash, sorted_data.encode(), hashlib.sha256).hexdigest()
    auth_data["hash"] = calculated_hash
    
    print_info(f"Сгенерированный hash: {calculated_hash}")
    print_info(f"Используемый SECRET_KEY: {SECRET_KEY}")
    
    return auth_data

def test_telegram_auth():
    """Тестирует Telegram авторизацию"""
    print_separator("ТЕСТ 1: TELEGRAM АВТОРИЗАЦИЯ")
    
    try:
        # Генерируем данные для авторизации
        auth_data = generate_telegram_auth_data()
        payload = {"auth_data": auth_data}
        
        print_step("Отправка запроса на /auth/telegram/login")
        print_info(f"Payload: {json.dumps(payload, indent=2, ensure_ascii=False)}")
        
        # Отправляем запрос
        response = client.post("/auth/telegram/login", json=payload)
        
        print_info(f"Статус код: {response.status_code}")
        print_info(f"Headers: {dict(response.headers)}")
        
        if response.status_code == 200:
            result = response.json()
            print_success("Telegram авторизация прошла успешно!")
            print_info(f"Получен токен: {result.get('access_token', 'НЕТ ТОКЕНА')[:50]}...")
            print_info(f"Тип токена: {result.get('token_type', 'НЕТ ТИПА')}")
            return result.get('access_token')
        else:
            print_error(f"Ошибка авторизации! Статус: {response.status_code}")
            try:
                error_detail = response.json()
                print_error(f"Детали ошибки: {json.dumps(error_detail, indent=2, ensure_ascii=False)}")
            except:
                print_error(f"Текст ответа: {response.text}")
            return None
            
    except Exception as e:
        print_error(f"Исключение при тестировании Telegram авторизации: {e}")
        import traceback
        traceback.print_exc()
        return None

def test_email_password_auth():
    """Тестирует Email/Password авторизацию (если есть эндпоинт)"""
    print_separator("ТЕСТ 2: EMAIL/PASSWORD АВТОРИЗАЦИЯ")
    
    print_step("Поиск эндпоинтов для Email/Password авторизации")
    
    # Список возможных эндпоинтов для авторизации
    possible_endpoints = [
        "/auth/login",
        "/auth/token", 
        "/token",
        "/login",
        "/users/login",
        "/admin/login"
    ]
    
    for endpoint in possible_endpoints:
        print_step(f"Проверка эндпоинта: {endpoint}")
        
        # Пробуем разные форматы данных
        test_formats = [
            # OAuth2PasswordRequestForm format
            {
                "data": {
                    "username": TEST_USER_EMAIL,
                    "password": TEST_USER_PASSWORD,
                    "grant_type": "password"
                },
                "content_type": "application/x-www-form-urlencoded",
                "method": "form"
            },
            # JSON format
            {
                "data": {
                    "email": TEST_USER_EMAIL,
                    "password": TEST_USER_PASSWORD
                },
                "content_type": "application/json",
                "method": "json"
            },
            # Alternative JSON format
            {
                "data": {
                    "username": TEST_USER_EMAIL,
                    "password": TEST_USER_PASSWORD
                },
                "content_type": "application/json", 
                "method": "json"
            }
        ]
        
        for i, test_format in enumerate(test_formats, 1):
            print_info(f"  Формат {i}: {test_format['method']} - {test_format['content_type']}")
            
            try:
                if test_format["method"] == "form":
                    response = client.post(endpoint, data=test_format["data"])
                else:
                    response = client.post(endpoint, json=test_format["data"])
                
                print_info(f"    Статус: {response.status_code}")
                
                if response.status_code == 200:
                    print_success(f"Найден рабочий эндпоинт: {endpoint}")
                    result = response.json()
                    print_info(f"    Ответ: {json.dumps(result, indent=4, ensure_ascii=False)}")
                    return result.get('access_token')
                elif response.status_code == 404:
                    print_info(f"    Эндпоинт не найден")
                    break  # Не пробуем другие форматы для несуществующего эндпоинта
                elif response.status_code == 422:
                    print_info(f"    Неверный формат данных")
                    try:
                        error_detail = response.json()
                        print_info(f"    Детали: {error_detail}")
                    except:
                        pass
                elif response.status_code == 401:
                    print_info(f"    Неверные учетные данные (но эндпоинт существует!)")
                    try:
                        error_detail = response.json()
                        print_info(f"    Детали: {error_detail}")
                    except:
                        pass
                else:
                    print_info(f"    Другая ошибка: {response.status_code}")
                    try:
                        error_detail = response.json()
                        print_info(f"    Детали: {error_detail}")
                    except:
                        print_info(f"    Текст: {response.text}")
                        
            except Exception as e:
                print_error(f"    Исключение: {e}")
    
    print_error("Email/Password авторизация не найдена или не настроена")
    return None

def test_token_validation(token: str):
    """Тестирует валидацию полученного токена"""
    print_separator("ТЕСТ 3: ВАЛИДАЦИЯ ТОКЕНА")
    
    if not token:
        print_error("Токен не предоставлен для валидации")
        return False
    
    print_step("Проверка токена на защищенном эндпоинте")
    
    # Пробуем использовать токен для доступа к защищенным ресурсам
    protected_endpoints = [
        "/users/me",
        "/users/profile", 
        "/hackathons/",
        "/teams/"
    ]
    
    headers = {"Authorization": f"Bearer {token}"}
    
    for endpoint in protected_endpoints:
        print_step(f"Тестирование эндпоинта: {endpoint}")
        
        try:
            response = client.get(endpoint, headers=headers)
            print_info(f"Статус: {response.status_code}")
            
            if response.status_code == 200:
                print_success(f"Токен валиден! Доступ к {endpoint} получен")
                try:
                    result = response.json()
                    print_info(f"Данные: {json.dumps(result, indent=2, ensure_ascii=False)[:200]}...")
                except:
                    print_info(f"Ответ: {response.text[:200]}...")
                return True
            elif response.status_code == 401:
                print_error(f"Токен невалиден или истек")
                try:
                    error_detail = response.json()
                    print_error(f"Детали: {error_detail}")
                except:
                    pass
            elif response.status_code == 404:
                print_info(f"Эндпоинт не найден")
            else:
                print_info(f"Другой статус: {response.status_code}")
                
        except Exception as e:
            print_error(f"Исключение при тестировании {endpoint}: {e}")
    
    return False

def check_database_state():
    """Проверяет состояние базы данных"""
    print_separator("ПРОВЕРКА СОСТОЯНИЯ БД")
    
    print_step("Подключение к базе данных")
    
    db = SessionLocal()
    try:
        # Проверяем количество пользователей
        user_count = db.query(User).count()
        print_info(f"Всего пользователей в БД: {user_count}")
        
        # Показываем первых 5 пользователей
        users = db.query(User).limit(5).all()
        print_info("Первые 5 пользователей:")
        for user in users:
            print_info(f"  ID: {user.id}, tg_id: {user.tg_id}, username: {user.username}, full_name: {user.full_name}")
        
        # Проверяем тестового пользователя
        test_user = db.query(User).filter(User.tg_id == TEST_TG_ID).first()
        if test_user:
            print_success(f"Тестовый пользователь найден: {test_user.full_name}")
        else:
            print_error("Тестовый пользователь не найден")
            
    except Exception as e:
        print_error(f"Ошибка при проверке БД: {e}")
    finally:
        db.close()

def main():
    """Главная функция - запускает все тесты"""
    print_separator("🚀 DEBUG AUTH SCRIPT - ЗАПУСК ТЕСТИРОВАНИЯ")
    print_info(f"Время запуска: {time.strftime('%Y-%m-%d %H:%M:%S')}")
    print_info(f"SECRET_KEY: {SECRET_KEY}")
    
    # Проверяем состояние БД
    check_database_state()
    
    # Создаем тестового пользователя
    test_user = create_test_user_in_db()
    if not test_user:
        print_error("Не удалось создать тестового пользователя. Завершение.")
        return
    
    # Тест 1: Telegram авторизация
    telegram_token = test_telegram_auth()
    
    # Тест 2: Email/Password авторизация
    email_token = test_email_password_auth()
    
    # Тест 3: Валидация токенов
    if telegram_token:
        test_token_validation(telegram_token)
    
    if email_token:
        test_token_validation(email_token)
    
    # Финальный отчет
    print_separator("📊 ИТОГОВЫЙ ОТЧЕТ")
    
    print_info("Результаты тестирования:")
    print_success("✅ Telegram авторизация: " + ("РАБОТАЕТ" if telegram_token else "НЕ РАБОТАЕТ"))
    print_success("✅ Email/Password авторизация: " + ("РАБОТАЕТ" if email_token else "НЕ НАЙДЕНА"))
    
    if not telegram_token and not email_token:
        print_error("❌ Ни один метод авторизации не работает!")
        print_info("Рекомендации:")
        print_info("1. Проверьте SECRET_KEY в app/utils/auth.py")
        print_info("2. Убедитесь что сервер запущен")
        print_info("3. Проверьте логи сервера на наличие ошибок")
    else:
        print_success("🎉 Хотя бы один метод авторизации работает!")
    
    print_separator("🏁 ТЕСТИРОВАНИЕ ЗАВЕРШЕНО")

if __name__ == "__main__":
    main()