import sqlite3

conn = sqlite3.connect('hackathon.db')
cursor = conn.cursor()

# Проверяем структуру таблицы users
cursor.execute('PRAGMA table_info(users)')
columns = cursor.fetchall()

print("Структура таблицы users:")
for column in columns:
    print(f"  {column[1]} ({column[2]})")

conn.close()