"""
Интеграционные тесты для проверки исправлений
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.database import Base, get_db
from app.models import User, Hackathon
from main import app

# Создаем тестовую БД в памяти
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Создаем таблицы
Base.metadata.create_all(bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

client = TestClient(app)

def test_server_status():
    """Тест 1: Проверка работы сервера"""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    print("✅ Сервер работает корректно")

def test_hackathon_location_field():
    """Тест 2: Проверка поля location в модели Hackathon"""
    # Создаем хакатон через API
    hackathon_data = {
        "title": "Test Hackathon",
        "description": "Test Description", 
        "location": "Moscow, Russia",
        "start_date": "2024-12-10T10:00:00",
        "end_date": "2024-12-12T18:00:00",
        "registration_deadline": "2024-12-08T23:59:59"
    }
    
    response = client.post("/hackathons/", json=hackathon_data)
    assert response.status_code == 201
    data = response.json()
    assert "location" in data
    assert data["location"] == "Moscow, Russia"
    print("✅ Поле location в модели Hackathon работает корректно")

def test_password_validation():
    """Тест 3: Проверка валидации длины пароля"""
    # Тест с коротким паролем (должен пройти)
    short_password_data = {
        "email": "test@example.com",
        "password": "short123",
        "full_name": "Test User"
    }
    
    response = client.post("/auth/register", json=short_password_data)
    assert response.status_code == 200
    print("✅ Короткий пароль принимается")
    
    # Тест с очень длинным паролем (должен быть отклонен)
    long_password = "a" * 100  # 100 символов > 72 байт
    long_password_data = {
        "email": "test2@example.com", 
        "password": long_password,
        "full_name": "Test User 2"
    }
    
    response = client.post("/auth/register", json=long_password_data)
    assert response.status_code == 422  # Validation error
    print("✅ Длинный пароль отклоняется валидацией")

def test_email_password_endpoints():
    """Тест 4: Проверка эндпоинтов email/password авторизации"""
    # Регистрация
    register_data = {
        "email": "auth_test@example.com",
        "password": "testpass123",
        "full_name": "Auth Test User"
    }
    
    response = client.post("/auth/register", json=register_data)
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    print("✅ Регистрация через email/password работает")
    
    # Вход
    login_data = {
        "username": "auth_test@example.com",  # OAuth2 использует username
        "password": "testpass123"
    }
    
    response = client.post("/auth/login", data=login_data)
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    token = data["access_token"]
    print("✅ Вход через email/password работает")
    
    # Проверка защищенного эндпоинта
    headers = {"Authorization": f"Bearer {token}"}
    response = client.get("/auth/me", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "auth_test@example.com"
    print("✅ Защищенный эндпоинт работает с JWT токеном")

def test_telegram_auth_endpoint():
    """Тест 5: Проверка эндпоинта Telegram авторизации"""
    # Проверяем, что эндпоинт существует (без реальной авторизации)
    fake_telegram_data = {
        "auth_data": {
            "id": "123456789",
            "first_name": "Test",
            "last_name": "User",
            "username": "testuser",
            "auth_date": "1640995200",
            "hash": "fake_hash"
        }
    }
    
    response = client.post("/auth/telegram/login", json=fake_telegram_data)
    # Ожидаем 401 из-за неверной подписи, но эндпоинт должен существовать
    assert response.status_code == 401
    print("✅ Эндпоинт Telegram авторизации существует")

def test_jwt_config():
    """Тест 6: Проверка конфигурации JWT"""
    from app.core.config import settings
    
    # Проверяем, что SECRET_KEY достаточно длинный
    assert len(settings.JWT_SECRET_KEY) >= 32
    assert settings.JWT_ALGORITHM == "HS256"
    assert settings.ACCESS_TOKEN_EXPIRE_MINUTES > 0
    print("✅ Конфигурация JWT корректна")

def test_bcrypt_dependency():
    """Тест 7: Проверка работы bcrypt"""
    from app.core.security import get_password_hash, verify_password
    
    password = "test_password_123"
    hashed = get_password_hash(password)
    
    # Проверяем, что хеш создается
    assert hashed is not None
    assert hashed != password
    
    # Проверяем верификацию
    assert verify_password(password, hashed) == True
    assert verify_password("wrong_password", hashed) == False
    print("✅ bcrypt работает корректно")

if __name__ == "__main__":
    print("🧪 Запуск интеграционных тестов...")
    print("=" * 60)
    
    try:
        test_server_status()
        test_hackathon_location_field()
        test_password_validation()
        test_email_password_endpoints()
        test_telegram_auth_endpoint()
        test_jwt_config()
        test_bcrypt_dependency()
        
        print("=" * 60)
        print("🎉 Все тесты прошли успешно!")
        print("✅ Все исправления работают корректно")
        
    except Exception as e:
        print(f"❌ Тест провален: {e}")
        import traceback
        traceback.print_exc()