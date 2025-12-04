"""
Простой тест API с использованием TestClient
"""
import pytest
from fastapi.testclient import TestClient
from main import app

# Создаем TestClient
client = TestClient(app)

def test_server_status():
    """Тест проверки статуса сервера"""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "message" in data

def test_admin_status():
    """Тест проверки статуса админ-панели"""
    response = client.get("/admin-status")
    assert response.status_code == 200
    data = response.json()
    assert "admin_enabled" in data
    assert "admin_url" in data

def test_hackathons_list():
    """Тест получения списка хакатонов"""
    response = client.get("/hackathons/")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)

def test_users_list():
    """Тест получения списка пользователей"""
    response = client.get("/users/")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)

def test_teams_list():
    """Тест получения списка команд"""
    response = client.get("/teams/")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)

def test_recommendations_without_user():
    """Тест рекомендаций без указания пользователя"""
    rec_request = {
        "for_what": "team",
        "hackathon_id": 1
    }
    
    response = client.post("/recommendations/", json=rec_request)
    # Ожидаем ошибку, так как не указан user_id
    assert response.status_code in [400, 422]

def test_recommendations_with_user():
    """Тест рекомендаций с указанием пользователя"""
    rec_request = {
        "for_what": "team",
        "hackathon_id": 1
    }
    
    # Передаем user_id через query параметр
    response = client.post("/recommendations/?user_id=1", json=rec_request)
    # Может быть 200 (успех) или 404 (пользователь не найден)
    assert response.status_code in [200, 404, 400]

def test_auth_register():
    """Тест регистрации пользователя"""
    user_data = {
        "tg_id": 12345,
        "username": "test_user",
        "full_name": "Test User",
        "skills": ["Python", "FastAPI"]
    }
    
    response = client.post("/auth/register", json=user_data)
    # Может быть 200 (успех) или 400 (пользователь уже существует)
    assert response.status_code in [200, 400]

def test_create_hackathon():
    """Тест создания хакатона"""
    hackathon_data = {
        "title": "Test Hackathon",
        "description": "Test description",
        "start_date": "2024-12-10T10:00:00",
        "end_date": "2024-12-12T18:00:00",
        "registration_deadline": "2024-12-09T23:59:59"
    }
    
    response = client.post("/hackathons/", json=hackathon_data)
    assert response.status_code in [200, 201]

def test_create_team():
    """Тест создания команды"""
    team_data = {
        "name": "Test Team",
        "description": "Test team description",
        "hackathon_id": 1
    }
    
    # Создаем команду от имени пользователя
    response = client.post("/teams/?user_id=1", json=team_data)
    # Может быть успех или ошибка в зависимости от состояния БД
    assert response.status_code in [200, 201, 400, 404]

if __name__ == "__main__":
    print("Запуск тестов с TestClient...")
    
    # Запускаем тесты по одному для лучшего контроля
    tests = [
        test_server_status,
        test_admin_status,
        test_hackathons_list,
        test_users_list,
        test_teams_list,
        test_recommendations_without_user,
        test_recommendations_with_user,
        test_auth_register,
        test_create_hackathon,
        test_create_team
    ]
    
    passed = 0
    failed = 0
    
    for test_func in tests:
        try:
            print(f"\n[ТЕСТ] {test_func.__name__}: ", end="")
            test_func()
            print("OK ПРОШЕЛ")
            passed += 1
        except Exception as e:
            print(f"ERROR ПРОВАЛЕН - {e}")
            failed += 1
    
    print(f"\n{'='*50}")
    print(f"РЕЗУЛЬТАТЫ: {passed} прошли, {failed} провалились")
    print(f"{'='*50}")