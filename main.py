from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import logging

# Настраиваем логирование
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

logger.info("Начинаем инициализацию приложения...")

try:
    from app.database import engine, Base
    logger.info("✓ Database импортирован")
except Exception as e:
    logger.error(f"✗ Ошибка импорта database: {e}", exc_info=True)
    raise

try:
    from app.routers import hackathons
    logger.info("✓ Routers импортированы")
except Exception as e:
    logger.error(f"✗ Ошибка импорта routers: {e}", exc_info=True)
    raise

# Создаем таблицы БД
try:
    Base.metadata.create_all(bind=engine)
    logger.info("✓ Таблицы БД созданы")
except Exception as e:
    logger.error(f"✗ Ошибка создания таблиц: {e}", exc_info=True)

# Создаем приложение
app = FastAPI(title="Hackathon API")
logger.info("✓ FastAPI приложение создано")

# НАСТРОЙКА CORS (ОЧЕНЬ ВАЖНО!)
# Это разрешает фронтенду стучаться к тебе
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Разрешаем всем (для хакатона ок)
    allow_credentials=True,
    allow_methods=["*"],  # Разрешаем любые методы (GET, POST и т.д.)
    allow_headers=["*"],
)

# Подключаем роутеры
app.include_router(hackathons.router)
logger.info("✓ Роутеры подключены")

@app.get("/")
def read_root():
    return {"status": "ok", "message": "Бэкенд работает! Поехали!"}

# Запуск сервера, если файл запущен напрямую
if __name__ == "__main__":
    logger.info("🚀 Запуск сервера на http://0.0.0.0:8000")
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=False)