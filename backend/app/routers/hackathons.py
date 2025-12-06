from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from app.database import get_db
from app.models import Hackathon, Team, User
from app.schemas.hackathon import HackathonCreate, HackathonUpdate, HackathonRead
from app.schemas.misc import CalendarResponse, NotificationResponse

router = APIRouter(prefix="/hackathons", tags=["hackathons"])


@router.post("/", response_model=HackathonRead, status_code=status.HTTP_201_CREATED)
def create_hackathon(hackathon_data: HackathonCreate, db: Session = Depends(get_db)):
    """Создать новый хакатон"""
    hackathon = Hackathon(**hackathon_data.model_dump())
    db.add(hackathon)
    db.commit()
    db.refresh(hackathon)
    return hackathon


@router.get("/", response_model=List[HackathonRead])
def get_hackathons(
    skip: int = 0,
    limit: int = 100,
    is_active: Optional[bool] = None,
    db: Session = Depends(get_db)
):
    """Получить список хакатонов"""
    query = db.query(Hackathon)
    
    if is_active is not None:
        query = query.filter(Hackathon.is_active == is_active)
    
    hackathons = query.offset(skip).limit(limit).all()
    return hackathons


@router.get("/active", response_model=List[HackathonRead])
def get_active_hackathons(db: Session = Depends(get_db)):
    """Получить список активных хакатонов"""
    hackathons = db.query(Hackathon).filter(
        Hackathon.is_active == True,
        Hackathon.registration_deadline > datetime.utcnow()
    ).all()
    return hackathons


@router.get("/calendar", response_model=CalendarResponse)
def get_hackathons_calendar(db: Session = Depends(get_db)):
    """Получить календарь хакатонов (предстоящие и прошедшие)"""
    now = datetime.utcnow()
    
    upcoming = db.query(Hackathon).filter(
        Hackathon.start_date > now,
        Hackathon.is_active == True
    ).order_by(Hackathon.start_date).all()
    
    history = db.query(Hackathon).filter(
        Hackathon.end_date < now
    ).order_by(Hackathon.start_date.desc()).limit(10).all()
    
    return CalendarResponse(upcoming=upcoming, history=history)


@router.get("/notifications", response_model=NotificationResponse)
def get_hackathon_notifications(tg_id: int, db: Session = Depends(get_db)):
    """Получить уведомления о ближайших хакатонах для пользователя"""
    user = db.query(User).filter(User.tg_id == tg_id).first()
    if not user:
        return NotificationResponse(has_notification=False)
    
    # Проверяем, есть ли хакатоны с близким дедлайном регистрации
    now = datetime.utcnow()
    upcoming_hackathon = db.query(Hackathon).filter(
        Hackathon.is_active == True,
        Hackathon.registration_deadline > now,
        Hackathon.start_date > now
    ).order_by(Hackathon.registration_deadline).first()
    
    if upcoming_hackathon:
        days_left = (upcoming_hackathon.registration_deadline - now).days
        if days_left <= 3:  # Уведомляем за 3 дня до дедлайна
            return NotificationResponse(
                has_notification=True,
                message=f"До окончания регистрации на '{upcoming_hackathon.title}' осталось {days_left} дней!",
                hackathon_id=upcoming_hackathon.id
            )
    
    return NotificationResponse(has_notification=False)


@router.get("/{hackathon_id}", response_model=HackathonRead)
def get_hackathon(hackathon_id: int, db: Session = Depends(get_db)):
    """Получить информацию о хакатоне по ID"""
    hackathon = db.query(Hackathon).filter(Hackathon.id == hackathon_id).first()
    if not hackathon:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Хакатон не найден"
        )
    return hackathon


@router.put("/{hackathon_id}", response_model=HackathonRead)
def update_hackathon(
    hackathon_id: int,
    hackathon_update: HackathonUpdate,
    db: Session = Depends(get_db)
):
    """Обновить информацию о хакатоне"""
    hackathon = db.query(Hackathon).filter(Hackathon.id == hackathon_id).first()
    if not hackathon:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Хакатон не найден"
        )
    
    # Обновляем поля
    update_data = hackathon_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(hackathon, field, value)
    
    db.commit()
    db.refresh(hackathon)
    return hackathon


@router.delete("/{hackathon_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_hackathon(hackathon_id: int, db: Session = Depends(get_db)):
    """Удалить хакатон"""
    hackathon = db.query(Hackathon).filter(Hackathon.id == hackathon_id).first()
    if not hackathon:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Хакатон не найден"
        )
    
    db.delete(hackathon)
    db.commit()


@router.get("/{hackathon_id}/teams", response_model=List[dict])
def get_hackathon_teams(hackathon_id: int, db: Session = Depends(get_db)):
    """Получить список команд хакатона"""
    hackathon = db.query(Hackathon).filter(Hackathon.id == hackathon_id).first()
    if not hackathon:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Хакатон не найден"
        )
    
    teams = db.query(Team).filter(Team.hackathon_id == hackathon_id).all()
    return teams


@router.get("/{hackathon_id}/stats")
def get_hackathon_stats(hackathon_id: int, db: Session = Depends(get_db)):
    """Получить статистику хакатона"""
    hackathon = db.query(Hackathon).filter(Hackathon.id == hackathon_id).first()
    if not hackathon:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Хакатон не найден"
        )
    
    teams_count = db.query(Team).filter(Team.hackathon_id == hackathon_id).count()
    participants_count = db.query(User).join(Team).filter(Team.hackathon_id == hackathon_id).count()
    
    return {
        "hackathon_id": hackathon_id,
        "teams_count": teams_count,
        "participants_count": participants_count,
        "registration_open": hackathon.registration_deadline > datetime.utcnow(),
        "days_until_start": (hackathon.start_date - datetime.utcnow()).days if hackathon.start_date > datetime.utcnow() else 0
    }
