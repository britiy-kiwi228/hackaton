from app.database import engine
from sqlalchemy import inspect

inspector = inspect(engine)
tables = inspector.get_table_names()

print("Таблицы в БД:", tables)

if 'hackathons' in tables:
    print("\nСтруктура hackathons:")
    columns = inspector.get_columns('hackathons')
    for col in columns:
        print(f"  {col['name']} ({col['type']})")
else:
    print("Таблица hackathons не найдена")