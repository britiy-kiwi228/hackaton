from app.database import engine
from app.models import Base

# Создаем все таблицы
Base.metadata.create_all(bind=engine)
print("База данных создана успешно!")