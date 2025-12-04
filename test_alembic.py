"""
Тестовый скрипт для проверки функциональности Alembic.
Проверяет: создание миграций, применение upgrade, откат downgrade,
проверку версий БД и целостность структуры таблиц.
"""

import os
import sys
import subprocess
import sqlite3
from pathlib import Path
from datetime import datetime

# Добавляем корень проекта в sys.path
PROJECT_ROOT = Path(__file__).parent
sys.path.insert(0, str(PROJECT_ROOT))

from app.database import engine, Base
from sqlalchemy import inspect
from sqlalchemy.orm import Session

# ================== КОНСТАНТЫ ==================
DB_PATH = PROJECT_ROOT / "hackathon.db"
ALEMBIC_INI = PROJECT_ROOT / "alembic.ini"


class Colors:
    """Цвета для вывода в консоль"""
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    RESET = '\033[0m'


def print_success(message: str):
    print(f"{Colors.GREEN}✓ {message}{Colors.RESET}")


def print_error(message: str):
    print(f"{Colors.RED}✗ {message}{Colors.RESET}")


def print_info(message: str):
    print(f"{Colors.BLUE}ℹ {message}{Colors.RESET}")


def print_warning(message: str):
    print(f"{Colors.YELLOW}⚠ {message}{Colors.RESET}")


def print_header(message: str):
    print(f"\n{Colors.BLUE}{'='*60}")
    print(f"{message}")
    print(f"{'='*60}{Colors.RESET}\n")


def backup_database() -> str:
    """Создает резервную копию БД если она существует"""
    if DB_PATH.exists():
        backup_path = DB_PATH.with_name(f"hackathon_backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}.db")
        import shutil
        shutil.copy2(DB_PATH, backup_path)
        print_info(f"Создана резервная копия БД: {backup_path}")
        return str(backup_path)
    return None


def delete_database():
    """Удаляет файл БД"""
    if DB_PATH.exists():
        DB_PATH.unlink()
        print_info(f"Удален файл БД: {DB_PATH}")


def check_database_exists() -> bool:
    """Проверяет наличие файла БД"""
    return DB_PATH.exists()


def get_alembic_version() -> str:
    """Получает текущую версию миграций из БД"""
    if not check_database_exists():
        return "No database"
    
    try:
        conn = sqlite3.connect(str(DB_PATH))
        cursor = conn.cursor()
        
        # Проверяем наличие таблицы alembic_version
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='alembic_version';")
        if cursor.fetchone() is None:
            conn.close()
            return "Not migrated"
        
        cursor.execute("SELECT version_num FROM alembic_version;")
        result = cursor.fetchone()
        conn.close()
        
        return result[0] if result else "Unknown"
    except Exception as e:
        print_error(f"Ошибка при получении версии: {e}")
        return "Error"


def get_table_count() -> int:
    """Получает количество таблиц в БД"""
    if not check_database_exists():
        return 0
    
    try:
        conn = sqlite3.connect(str(DB_PATH))
        cursor = conn.cursor()
        cursor.execute("""
            SELECT COUNT(*) FROM sqlite_master 
            WHERE type='table' AND name != 'sqlite_sequence' AND name != 'alembic_version';
        """)
        count = cursor.fetchone()[0]
        conn.close()
        return count
    except Exception as e:
        print_error(f"Ошибка при получении количества таблиц: {e}")
        return 0


def get_tables_list() -> list:
    """Получает список таблиц в БД"""
    if not check_database_exists():
        return []
    
    try:
        conn = sqlite3.connect(str(DB_PATH))
        cursor = conn.cursor()
        cursor.execute("""
            SELECT name FROM sqlite_master 
            WHERE type='table' AND name NOT IN ('sqlite_sequence', 'alembic_version')
            ORDER BY name;
        """)
        tables = [row[0] for row in cursor.fetchall()]
        conn.close()
        return tables
    except Exception as e:
        print_error(f"Ошибка при получении списка таблиц: {e}")
        return []


def get_table_columns(table_name: str) -> dict:
    """Получает информацию о колонках таблицы"""
    if not check_database_exists():
        return {}
    
    try:
        conn = sqlite3.connect(str(DB_PATH))
        cursor = conn.cursor()
        cursor.execute(f"PRAGMA table_info({table_name});")
        
        columns = {}
        for row in cursor.fetchall():
            cid, name, type_, notnull, dflt_value, pk = row
            columns[name] = {
                'type': type_,
                'not_null': bool(notnull),
                'primary_key': bool(pk)
            }
        
        conn.close()
        return columns
    except Exception as e:
        print_error(f"Ошибка при получении колонок таблицы {table_name}: {e}")
        return {}


def run_alembic_command(command: str) -> tuple:
    """Выполняет команду alembic и возвращает (success, output, error)"""
    try:
        result = subprocess.run(
            f"alembic {command}",
            shell=True,
            cwd=str(PROJECT_ROOT),
            capture_output=True,
            text=True
        )
        success = result.returncode == 0
        return success, result.stdout, result.stderr
    except Exception as e:
        return False, "", str(e)


def test_alembic_upgrade():
    """Тест применения миграций (upgrade)"""
    print_header("ТЕСТ 1: Применение миграций (UPGRADE)")
    
    print_info("Проверка текущего состояния БД...")
    print(f"  - БД существует: {check_database_exists()}")
    print(f"  - Версия миграций: {get_alembic_version()}")
    print(f"  - Количество таблиц: {get_table_count()}")
    
    print_info("Выполнение: alembic upgrade head")
    success, stdout, stderr = run_alembic_command("upgrade head")
    
    if success:
        print_success("Миграции успешно применены")
        print("\nВывод команды:")
        print(stdout)
    else:
        print_error("Ошибка при применении миграций")
        print("\nОшибка:")
        print(stderr)
        return False
    
    # Проверяем результаты
    print_info("Проверка результатов...")
    current_version = get_alembic_version()
    table_count = get_table_count()
    tables = get_tables_list()
    
    print(f"  - Версия миграций: {current_version}")
    print(f"  - Количество таблиц: {table_count}")
    print(f"  - Таблицы: {', '.join(tables)}")
    
    if table_count > 0 and current_version != "Not migrated":
        print_success(f"Все {table_count} таблицы успешно созданы!")
        return True
    else:
        print_error("Таблицы не были созданы")
        return False


def test_table_structure():
    """Тест проверки структуры таблиц"""
    print_header("ТЕСТ 2: Проверка структуры таблиц")
    
    expected_tables = [
        'users', 'skills', 'hackathons', 'teams', 
        'achievements', 'requests', 'join_requests',
        'hackathon_participations', 'user_skills', 'user_participations'
    ]
    
    tables = get_tables_list()
    print_info(f"Найдено таблиц: {len(tables)} (ожидалось: {len(expected_tables)})")
    
    all_found = True
    for expected_table in expected_tables:
        if expected_table in tables:
            print_success(f"Таблица '{expected_table}' найдена")
        else:
            print_error(f"Таблица '{expected_table}' НЕ найдена")
            all_found = False
    
    # Проверяем структуру ключевых таблиц
    print_info("\nПроверка структуры таблицы 'users':")
    users_columns = get_table_columns('users')
    expected_user_columns = ['id', 'full_name', 'email', 'tg_id', 'main_role', 'password_hash']
    
    for col in expected_user_columns:
        if col in users_columns:
            col_info = users_columns[col]
            print_success(f"  Колонка '{col}' найдена (тип: {col_info['type']})")
        else:
            print_error(f"  Колонка '{col}' НЕ найдена")
            all_found = False
    
    return all_found


def test_alembic_downgrade():
    """Тест отката миграций (downgrade)"""
    print_header("ТЕСТ 3: Откат миграций (DOWNGRADE)")
    
    print_info("Текущее состояние БД:")
    print(f"  - Версия миграций: {get_alembic_version()}")
    print(f"  - Количество таблиц: {get_table_count()}")
    
    print_info("Выполнение: alembic downgrade base")
    success, stdout, stderr = run_alembic_command("downgrade base")
    
    if success:
        print_success("Откат миграций выполнен")
        print("\nВывод команды:")
        print(stdout)
    else:
        print_error("Ошибка при откате миграций")
        print("\nОшибка:")
        print(stderr)
        return False
    
    # Проверяем результаты
    print_info("Проверка результатов...")
    current_version = get_alembic_version()
    table_count = get_table_count()
    
    print(f"  - Версия миграций: {current_version}")
    print(f"  - Количество таблиц: {table_count}")
    
    if table_count == 0 and current_version == "Not migrated":
        print_success("Все таблицы успешно удалены!")
        return True
    else:
        print_error("Таблицы не были удалены")
        return False


def test_alembic_history():
    """Тест истории миграций"""
    print_header("ТЕСТ 4: История миграций")
    
    print_info("Выполнение: alembic history")
    success, stdout, stderr = run_alembic_command("history")
    
    if success:
        print_success("История миграций получена")
        print("\nВывод:")
        print(stdout)
        return True
    else:
        print_error("Ошибка при получении истории")
        print("\nОшибка:")
        print(stderr)
        return False


def test_alembic_current():
    """Тест текущей версии миграций"""
    print_header("ТЕСТ 5: Текущая версия миграций")
    
    print_info("Выполнение: alembic current")
    success, stdout, stderr = run_alembic_command("current")
    
    if success:
        print_success("Текущая версия получена")
        print("\nВывод:")
        print(stdout)
        return True
    else:
        print_error("Ошибка при получении текущей версии")
        print("\nОшибка:")
        print(stderr)
        return False


def test_sqlalchemy_models():
    """Тест проверки моделей SQLAlchemy"""
    print_header("ТЕСТ 6: Проверка моделей SQLAlchemy")
    
    from app import models
    
    print_info("Импортированные модели:")
    model_classes = [
        'User', 'Skill', 'Hackathon', 'Team', 'Achievement',
        'Request', 'JoinRequest', 'HackathonParticipation'
    ]
    
    for model_name in model_classes:
        if hasattr(models, model_name):
            model_class = getattr(models, model_name)
            print_success(f"  Модель '{model_name}' найдена")
        else:
            print_error(f"  Модель '{model_name}' НЕ найдена")
            return False
    
    return True


def run_full_test():
    """Запускает полный набор тестов"""
    print_header("ПОЛНОЕ ТЕСТИРОВАНИЕ СИСТЕМЫ ALEMBIC")
    print(f"Проект: {PROJECT_ROOT}")
    print(f"БД: {DB_PATH}")
    print(f"Alembic INI: {ALEMBIC_INI}\n")
    
    # Резервная копия
    backup_database()
    
    # Удаляем старую БД для чистого теста
    print_info("Подготовка к тестированию: удаление старой БД...")
    delete_database()
    
    # Тесты
    results = {}
    results['SQLAlchemy Models'] = test_sqlalchemy_models()
    results['Alembic Upgrade'] = test_alembic_upgrade()
    results['Table Structure'] = test_table_structure()
    results['Alembic History'] = test_alembic_history()
    results['Alembic Current'] = test_alembic_current()
    results['Alembic Downgrade'] = test_alembic_downgrade()
    
    # Повторно применяем миграции для финального состояния
    print_info("\nПовторное применение миграций для финального состояния...")
    run_alembic_command("upgrade head")
    
    # Итоги
    print_header("ИТОГИ ТЕСТИРОВАНИЯ")
    passed = sum(1 for v in results.values() if v)
    total = len(results)
    
    for test_name, result in results.items():
        status = "PASSED" if result else "FAILED"
        symbol = "✓" if result else "✗"
        color = Colors.GREEN if result else Colors.RED
        print(f"{color}{symbol} {test_name}: {status}{Colors.RESET}")
    
    print(f"\n{Colors.BLUE}{'='*60}")
    print(f"Результат: {passed}/{total} тестов пройдено")
    print(f"{'='*60}{Colors.RESET}\n")
    
    if passed == total:
        print_success("ВСЕ ТЕСТЫ ПРОЙДЕНЫ УСПЕШНО! ✓")
    else:
        print_error(f"НЕ ВСЕ ТЕСТЫ ПРОЙДЕНЫ ({total - passed} ошибок)")
    
    # Финальная информация о БД
    print_info("\nФинальное состояние БД:")
    print(f"  - БД существует: {check_database_exists()}")
    print(f"  - Версия миграций: {get_alembic_version()}")
    print(f"  - Количество таблиц: {get_table_count()}")
    print(f"  - Таблицы: {', '.join(get_tables_list())}")
    
    return passed == total


if __name__ == "__main__":
    try:
        success = run_full_test()
        sys.exit(0 if success else 1)
    except Exception as e:
        print_error(f"\nКритическая ошибка: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)