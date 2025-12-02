from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from app.database import engine, Base
from app.routers import hackathons

# Создаем таблицы БД
Base.metadata.create_all(bind=engine)

# Создаем приложение
app = FastAPI(title="Hackathon API")

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

@app.get("/")
def read_root():
    return {"status": "ok", "message": "Бэкенд работает! Поехали!"}

# Запуск сервера, если файл запущен напрямую
if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)