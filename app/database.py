from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# Подключаемся к SQLite БД (можно заменить на PostgreSQL)
DATABASE_URL = "sqlite:///./test.db"

engine = create_engine(
    DATABASE_URL, 
    connect_args={"check_same_thread": False}  # Только для SQLite
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    """Зависимость для получения сессии БД в эндпоинтах"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
