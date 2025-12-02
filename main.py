from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import logging
from sqladmin import Admin, ModelView
from sqlalchemy.orm import Session

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

try:
    from app.routers import users
    logger.info("✓ Users router импортирован")
except Exception as e:
    logger.error(f"✗ Ошибка импорта users router: {e}", exc_info=True)
    raise

# Импортируем модели для админ-панели
from app.models import User, Hackathon, Team, Skill

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
app.include_router(users.router)
logger.info("✓ Роутеры подключены")


# ==================== АДМИН-ПАНЕЛЬ ====================

# Классы представления для админ-панели
class UserAdmin(ModelView, model=User):
    """Админ-панель для пользователей"""
    column_list = [User.id, User.tg_id, User.username, User.full_name, User.main_role, User.team_id, User.created_at]
    column_searchable_list = [User.full_name, User.username, User.tg_id]
    column_sortable_list = [User.created_at, User.full_name]
    column_filters = [User.main_role]
    page_size = 20


class HackathonAdmin(ModelView, model=Hackathon):
    """Админ-панель для хакатонов"""
    column_list = [Hackathon.id, Hackathon.title, Hackathon.location, Hackathon.start_date, Hackathon.end_date, Hackathon.is_active]
    column_searchable_list = [Hackathon.title, Hackathon.location]
    column_sortable_list = [Hackathon.start_date, Hackathon.title]
    column_filters = [Hackathon.is_active, Hackathon.location]
    page_size = 20


class TeamAdmin(ModelView, model=Team):
    """Админ-панель для команд"""
    column_list = [Team.id, Team.name, Team.hackathon_id, Team.captain_id, Team.is_looking, Team.created_at]
    column_searchable_list = [Team.name, Team.chat_link]
    column_sortable_list = [Team.created_at, Team.name]
    column_filters = [Team.is_looking, Team.hackathon_id]
    page_size = 20


class SkillAdmin(ModelView, model=Skill):
    """Админ-панель для навыков"""
    column_list = [Skill.id, Skill.name]
    column_searchable_list = [Skill.name]
    page_size = 50


# Регистрируем админ-панель
admin = Admin(app=app, engine=engine, title="Hackathon Admin Panel")

# Добавляем модели в админ-панель
admin.add_model_view(UserAdmin)
admin.add_model_view(HackathonAdmin)
admin.add_model_view(TeamAdmin)
admin.add_model_view(SkillAdmin)

logger.info("✓ Админ-панель настроена")


@app.get("/")
def read_root():
    return {"status": "ok", "message": "Бэкенд работает! Поехали!"}

# Запуск сервера, если файл запущен напрямую
if __name__ == "__main__":
    logger.info("🚀 Запуск сервера на http://0.0.0.0:8000")
    logger.info("📊 Админ-панель доступна на http://0.0.0.0:8000/admin")
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=False)