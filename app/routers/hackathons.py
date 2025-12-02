from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import and_
from datetime import datetime, timedelta
from typing import List, Optional
from pydantic import BaseModel

from app.database import get_db
from app.models import Hackathon

# ==================== PYDANTIC СХЕМЫ ====================

class HackathonResponse(BaseModel):
    """Схема для ответа с информацией о хакатоне"""
    id: int
    title: str
    description: str
    start_date: datetime
    end_date: datetime
    registration_deadline: datetime
    logo_url: Optional[str]
    location: str
    is_active: bool
    
    class Config:
        from_attributes = True


class CalendarResponse(BaseModel):
    """Ответ для календаря хакатонов"""
    upcoming: List[HackathonResponse]
    history: List[HackathonResponse]


class NotificationResponse(BaseModel):
    """Ответ с уведомлением о ближайшем хакатоне"""
    has_notification: bool
    message: Optional[str] = None
    hackathon_id: Optional[int] = None


# ==================== РОУТЕР ====================

router = APIRouter(prefix="/hackathons", tags=["hackathons"])


@router.get("/calendar", response_model=CalendarResponse)
def get_hackathons_calendar(db: Session = Depends(get_db)):
    """
    GET /hackathons/calendar
    Возвращает список будущих и прошедших хакатонов.
    Будущие отсортированы по start_date (от ближайшего к дальнему).
    """
    now = datetime.utcnow()
    
    # Получаем все хакатоны
    all_hackathons = db.query(Hackathon).all()
    
    # Разделяем на будущие и прошедшие
    upcoming = [h for h in all_hackathons if h.start_date > now]
    history = [h for h in all_hackathons if h.start_date <= now]
    
    # Сортируем будущие по start_date (от ближайшего)
    upcoming.sort(key=lambda x: x.start_date)
    
    # Сортируем историю в обратном порядке (от новых к старым)
    history.sort(key=lambda x: x.start_date, reverse=True)
    
    return CalendarResponse(
        upcoming=[HackathonResponse.from_orm(h) for h in upcoming],
        history=[HackathonResponse.from_orm(h) for h in history],
    )


@router.get("/notifications/check_upcoming", response_model=NotificationResponse)
def check_upcoming_hackathon(db: Session = Depends(get_db)):
    """
    GET /notifications/check_upcoming
    Проверяет, есть ли хакатон, который начнется в течение 3 дней.
    Используется фронтендом при входе в приложение.
    """
    now = datetime.utcnow()
    three_days_later = now + timedelta(days=3)
    
    # Ищем хакатон, который начнется в течение 3 дней
    upcoming_hackathon = db.query(Hackathon).filter(
        and_(
            Hackathon.start_date > now,
            Hackathon.start_date <= three_days_later,
            Hackathon.is_active == True,
        )
    ).order_by(Hackathon.start_date).first()
    
    if not upcoming_hackathon:
        return NotificationResponse(has_notification=False)
    
    # Вычисляем, через сколько часов начнется хакатон
    time_diff = upcoming_hackathon.start_date - now
    hours_left = round(time_diff.total_seconds() / 3600)
    
    # Формируем сообщение
    if hours_left < 1:
        hours_text = "менее часа"
    elif hours_left == 1:
        hours_text = "1 час"
    elif hours_left % 10 == 1 and hours_left % 100 != 11:
        hours_text = f"{hours_left} час"
    elif hours_left % 10 in [2, 3, 4] and hours_left % 100 not in [12, 13, 14]:
        hours_text = f"{hours_left} часа"
    else:
        hours_text = f"{hours_left} часов"
    
    message = f"Хакатон '{upcoming_hackathon.title}' начинается через {hours_text}! Успей собрать команду."
    
    return NotificationResponse(
        has_notification=True,
        message=message,
        hackathon_id=upcoming_hackathon.id,
    )
