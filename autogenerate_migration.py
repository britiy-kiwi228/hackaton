"""
Скрипт для автоматической генерации миграций при изменении моделей.
Использует Alembic autogenerate для сравнения текущей схемы с моделями.
"""

import os
import sys
import subprocess
from pathlib import Path
from datetime import datetime

# Добавляем корень проекта в sys.path
PROJECT_ROOT = Path(__file__).parent
sys.path.insert(0, str(PROJECT_ROOT))

from app.database import engine, Base
from app import models


class Colors:
    """Цвета для вывода в консоль"""
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    RESET = '\033[0m'


def print_success(text: str):
    print(f"{Colors.GREEN}✓ {text}{Colors.RESET}")


def print_error(text: str):
    print(f"{Colors.RED}✗ {text}{Colors.RESET}")


def print_info(text: str):
    print(f"{Colors.BLUE}ℹ {text}{Colors.RESET}")


def print_warning(text: str):
    print(f"{Colors.YELLOW}⚠ {text}{Colors.RESET}")


def print_header(text: str):
    print(f"\n{Colors.BLUE}{'='*70}")
    print(f"  {text}")
    print(f"{'='*70}{Colors.RESET}\n")


def get_alembic_version():
    """Получает текущую версию миграций"""
    try:
        result = subprocess.run(
            "alembic current",
            shell=True,
            cwd=str(PROJECT_ROOT),
            capture_output=True,
            text=True
        )
        return result.stdout.strip() if result.returncode == 0 else "Unknown"
    except:
        return "Error"


def check_models_imported():
    """Проверяет, что все модели импортированы"""
    print_info("Проверка импортированных моделей:")
    
    model_list = [
        'User', 'Skill', 'Hackathon', 'Team', 'Achievement',
        'Request', 'JoinRequest', 'HackathonParticipation'
    ]
    
    all_imported = True
    for model_name in model_list:
        if hasattr(models, model_name):
            print_success(f"  Модель '{model_name}' импортирована")
        else:
            print_error(f"  Модель '{model_name}' НЕ импортирована")
            all_imported = False
    
    return all_imported


def generate_migration(message: str = None):
    """Генерирует новую миграцию с автоматическим определением изменений"""
    print_header("ГЕНЕРАЦИЯ МИГРАЦИИ")
    
    # Если сообщение не указано, генерируем по умолчанию
    if not message:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        message = f"auto_migration_{timestamp}"
    
    # Очищаем сообщение от спецсимволов
    message = message.replace(" ", "_").replace("-", "_").lower()
    
    print_info(f"Сообщение миграции: {message}")
    print_info(f"Текущая версия: {get_alembic_version()}")
    
    print_info("\nВыполнение: alembic revision --autogenerate -m '<message>'")
    print_warning("⚠️  ВНИМАНИЕ! Всегда проверяйте сгенерированные миграции перед применением!")
    
    try:
        result = subprocess.run(
            f'alembic revision --autogenerate -m "{message}"',
            shell=True,
            cwd=str(PROJECT_ROOT),
            capture_output=True,
            text=True
        )
        
        if result.returncode == 0:
            print_success("\nМиграция успешно сгенерирована!")
            print("\nВывод команды:")
            print(result.stdout)
            
            # Пытаемся извлечь имя файла миграции
            if "Generating" in result.stdout:
                lines = result.stdout.split('\n')
                for line in lines:
                    if "Generating" in line or ".py" in line:
                        print_info(f"Создан файл: {line.strip()}")
            
            return True
        else:
            print_error("Ошибка при генерации миграции")
            print("\nОшибка:")
            print(result.stderr)
            return False
    
    except Exception as e:
        print_error(f"Исключение при генерации миграции: {e}")
        return False


def apply_migrations():
    """Применяет все миграции"""
    print_header("ПРИМЕНЕНИЕ МИГРАЦИЙ")
    
    print_info("Выполнение: alembic upgrade head")
    
    try:
        result = subprocess.run(
            "alembic upgrade head",
            shell=True,
            cwd=str(PROJECT_ROOT),
            capture_output=True,
            text=True
        )
        
        if result.returncode == 0:
            print_success("Миграции успешно применены!")
            print("\nВывод команды:")
            print(result.stdout)
            print_info(f"Новая версия: {get_alembic_version()}")
            return True
        else:
            print_error("Ошибка при применении миграций")
            print("\nОшибка:")
            print(result.stderr)
            return False
    
    except Exception as e:
        print_error(f"Исключение при применении миграций: {e}")
        return False


def show_migration_history():
    """Показывает историю миграций"""
    print_header("ИСТОРИЯ МИГРАЦИЙ")
    
    print_info("Выполнение: alembic history")
    
    try:
        result = subprocess.run(
            "alembic history",
            shell=True,
            cwd=str(PROJECT_ROOT),
            capture_output=True,
            text=True
        )
        
        if result.returncode == 0:
            print(result.stdout)
            return True
        else:
            print_error("Ошибка при получении истории")
            print(result.stderr)
            return False
    
    except Exception as e:
        print_error(f"Исключение: {e}")
        return False


def main():
    """Основная функция"""
    print(f"{Colors.CYAN}")
    print(r"""
    ╔══════════════════════════════════════════════════════════════════════════╗
    ║                                                                          ║
    ║                 УТИЛИТА ДЛЯ ГЕНЕРАЦИИ МИГРАЦИЙ                          ║
    ║                     (Autogenerate Script)                               ║
    ║                                                                          ║
    ╚══════════════════════════════════════════════════════════════════════════╝
    """)
    print(Colors.RESET)
    
    # Проверяем модели
    if not check_models_imported():
        print_warning("\nНекоторые модели не импортированы. Продолжить? (y/n)")
        if input().lower() != 'y':
            sys.exit(1)
    
    # Главное меню
    while True:
        print(f"\n{Colors.CYAN}{'='*70}")
        print("Выберите действие:")
        print(f"{'='*70}{Colors.RESET}")
        print("  1. Сгенерировать новую миграцию (autogenerate)")
        print("  2. Применить все миграции (upgrade head)")
        print("  3. Показать историю миграций")
        print("  4. Сгенерировать и применить миграцию")
        print("  5. Выход")
        
        choice = input(f"\n{Colors.YELLOW}Введите номер (1-5): {Colors.RESET}").strip()
        
        if choice == "1":
            msg = input(f"{Colors.YELLOW}Введите описание миграции (или Enter для автоматического): {Colors.RESET}").strip()
            generate_migration(msg if msg else None)
        
        elif choice == "2":
            apply_migrations()
        
        elif choice == "3":
            show_migration_history()
        
        elif choice == "4":
            msg = input(f"{Colors.YELLOW}Введите описание миграции (или Enter для автоматического): {Colors.RESET}").strip()
            if generate_migration(msg if msg else None):
                print()
                apply_migrations()
        
        elif choice == "5":
            print(f"{Colors.GREEN}До свидания!{Colors.RESET}\n")
            break
        
        else:
            print_error("Неверный выбор. Попробуйте снова.")
        
        input(f"\n{Colors.CYAN}Нажмите Enter для продолжения...{Colors.RESET}")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print(f"\n{Colors.YELLOW}Прервано пользователем{Colors.RESET}\n")
        sys.exit(0)
    except Exception as e:
        print_error(f"\nКритическая ошибка: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)