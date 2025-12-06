"""
Утилита для проверки структуры БД.
Выводит информацию о всех таблицах, их колонках, индексах и внешних ключах.
"""

import sqlite3
import sys
from pathlib import Path
from tabulate import tabulate

DB_PATH = Path(__file__).parent / "hackathon.db"


class Colors:
    """Цвета для вывода в консоль"""
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    RESET = '\033[0m'


def print_header(text: str):
    print(f"\n{Colors.BLUE}{'='*80}")
    print(f"{text:^80}")
    print(f"{'='*80}{Colors.RESET}\n")


def print_subheader(text: str):
    print(f"{Colors.CYAN}► {text}{Colors.RESET}")


def print_error(text: str):
    print(f"{Colors.RED}✗ {text}{Colors.RESET}")


def check_database():
    """Проверяет наличие БД"""
    if not DB_PATH.exists():
        print_error(f"БД не найдена: {DB_PATH}")
        return False
    
    try:
        conn = sqlite3.connect(str(DB_PATH))
        conn.close()
        print(f"{Colors.GREEN}✓ БД найдена: {DB_PATH}{Colors.RESET}")
        return True
    except Exception as e:
        print_error(f"Ошибка при подключении к БД: {e}")
        return False


def get_all_tables():
    """Получает список всех таблиц"""
    conn = sqlite3.connect(str(DB_PATH))
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT name FROM sqlite_master 
        WHERE type='table' 
        AND name NOT IN ('sqlite_sequence', 'alembic_version')
        ORDER BY name;
    """)
    
    tables = [row[0] for row in cursor.fetchall()]
    conn.close()
    return tables


def get_table_info(table_name: str):
    """Получает полную информацию о таблице"""
    conn = sqlite3.connect(str(DB_PATH))
    cursor = conn.cursor()
    
    # Получаем колонки
    cursor.execute(f"PRAGMA table_info({table_name});")
    columns_raw = cursor.fetchall()
    
    # Получаем индексы
    cursor.execute(f"PRAGMA index_list({table_name});")
    indexes_raw = cursor.fetchall()
    
    # Получаем внешние ключи
    cursor.execute(f"PRAGMA foreign_key_list({table_name});")
    fks_raw = cursor.fetchall()
    
    conn.close()
    
    return columns_raw, indexes_raw, fks_raw


def get_table_row_count(table_name: str):
    """Получает количество строк в таблице"""
    try:
        conn = sqlite3.connect(str(DB_PATH))
        cursor = conn.cursor()
        cursor.execute(f"SELECT COUNT(*) FROM {table_name};")
        count = cursor.fetchone()[0]
        conn.close()
        return count
    except:
        return 0


def display_table_structure(table_name: str):
    """Выводит структуру таблицы в красивом формате"""
    print_subheader(f"Таблица: {table_name}")
    
    columns, indexes, fks = get_table_info(table_name)
    row_count = get_table_row_count(table_name)
    
    # Информация о строках
    print(f"  Строк: {Colors.YELLOW}{row_count}{Colors.RESET}")
    
    # Колонки
    if columns:
        print(f"\n  {Colors.CYAN}Колонки:{Colors.RESET}")
        columns_data = []
        for cid, name, type_, notnull, dflt_value, pk in columns:
            pk_mark = "🔑" if pk else ""
            nn_mark = "NOT NULL" if notnull else "NULL"
            columns_data.append([name, type_, nn_mark, pk_mark])
        
        print(tabulate(
            columns_data,
            headers=["Имя", "Тип", "Ограничение", "ПК"],
            tablefmt="grid",
            stralign="left"
        ))
    
    # Индексы
    if indexes:
        print(f"\n  {Colors.CYAN}Индексы:{Colors.RESET}")
        indexes_data = []
        for seq, name, unique, origin, partial in indexes:
            unique_mark = "✓" if unique else ""
            indexes_data.append([name, origin, unique_mark])
        
        print(tabulate(
            indexes_data,
            headers=["Имя", "Тип", "Уникальный"],
            tablefmt="grid"
        ))
    
    # Внешние ключи
    if fks:
        print(f"\n  {Colors.CYAN}Внешние ключи:{Colors.RESET}")
        fks_data = []
        for id_, seq, table, from_, to, on_update, on_delete, match in fks:
            fks_data.append([from_, f"{table}.{to}", on_delete])
        
        print(tabulate(
            fks_data,
            headers=["Колонка", "Ссылается на", "При удалении"],
            tablefmt="grid"
        ))
    
    print()


def get_database_statistics():
    """Получает статистику БД"""
    print_header("СТАТИСТИКА БД")
    
    tables = get_all_tables()
    total_rows = 0
    
    stats_data = []
    for table in tables:
        row_count = get_table_row_count(table)
        total_rows += row_count
        stats_data.append([table, row_count])
    
    print(tabulate(
        stats_data,
        headers=["Таблица", "Строк"],
        tablefmt="grid",
        stralign="left"
    ))
    
    print(f"\n{Colors.YELLOW}Всего таблиц: {len(tables)}")
    print(f"Всего строк: {total_rows}{Colors.RESET}\n")


def display_full_structure():
    """Выводит полную структуру БД"""
    print_header("СТРУКТУРА БД")
    
    tables = get_all_tables()
    
    if not tables:
        print_error("В БД нет таблиц")
        return
    
    for table in tables:
        display_table_structure(table)


def get_relationships():
    """Анализирует связи между таблицами"""
    print_header("СВЯЗИ МЕЖДУ ТАБЛИЦАМИ")
    
    tables = get_all_tables()
    relationships = []
    
    for table in tables:
        _, _, fks = get_table_info(table)
        for id_, seq, fk_table, from_col, to_col, on_update, on_delete, match in fks:
            relationships.append([table, from_col, fk_table, to_col, on_delete])
    
    if relationships:
        print(tabulate(
            relationships,
            headers=["Таблица", "Колонка", "→ Ссылается", "На колонку", "При удалении"],
            tablefmt="grid"
        ))
    else:
        print("Связи не найдены")
    
    print()


def main():
    """Основная функция"""
    print(f"{Colors.GREEN}")
    print(r"""
    ╔══════════════════════════════════════════════════════════════════════════════╗
    ║                                                                              ║
    ║                  УТИЛИТА ПРОВЕРКИ СТРУКТУРЫ БД                              ║
    ║                                                                              ║
    ╚══════════════════════════════════════════════════════════════════════════════╝
    """)
    print(Colors.RESET)
    
    if not check_database():
        sys.exit(1)
    
    try:
        # Главное меню
        while True:
            print(f"\n{Colors.CYAN}Выберите действие:{Colors.RESET}")
            print("  1. Показать полную структуру БД")
            print("  2. Показать статистику БД")
            print("  3. Показать связи между таблицами")
            print("  4. Показать всё")
            print("  5. Выход")
            
            choice = input(f"\n{Colors.YELLOW}Введите номер (1-5): {Colors.RESET}").strip()
            
            if choice == "1":
                display_full_structure()
            elif choice == "2":
                get_database_statistics()
            elif choice == "3":
                get_relationships()
            elif choice == "4":
                display_full_structure()
                get_database_statistics()
                get_relationships()
            elif choice == "5":
                print(f"{Colors.GREEN}До свидания!{Colors.RESET}\n")
                break
            else:
                print_error("Неверный выбор. Попробуйте снова.")
    
    except KeyboardInterrupt:
        print(f"\n{Colors.YELLOW}Прервано пользователем{Colors.RESET}\n")
        sys.exit(0)
    except Exception as e:
        print_error(f"Ошибка: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()