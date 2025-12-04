from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models import User, Skill, Achievement
from app.schemas import (
    UserResponse, UserLogin, UserUpdate, UserListResponse,
    SkillResponse, AchievementResponse
)

router = APIRouter(prefix="/users", tags=["users"])


@router.post("/login", response_model=UserResponse)
def login_user(user_data: UserLogin, db: Session = Depends(get_db)):
    """Авторизация пользователя через Telegram ID"""
    # Ищем пользователя по tg_id
    user = db.query(User).filter(User.tg_id == user_data.tg_id).first()
    
    if not user:
        # Создаем нового пользователя
        user = User(
            tg_id=user_data.tg_id,
            username=user_data.username,
            full_name=user_data.full_name,
            bio="",
            ready_to_work=True
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    else:
        # Обновляем данные существующего пользователя
        user.username = user_data.username
        user.full_name = user_data.full_name
        db.commit()
        db.refresh(user)
    
    return user


@router.get("/me", response_model=UserResponse)
def get_current_user(tg_id: int, db: Session = Depends(get_db)):
    """Получить информацию о текущем пользователе"""
    user = db.query(User).filter(User.tg_id == tg_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Пользователь не найден"
        )
    return user


@router.put("/me", response_model=UserResponse)
def update_current_user(
    tg_id: int,
    user_update: UserUpdate,
    db: Session = Depends(get_db)
):
    """Обновить профиль текущего пользователя"""
    user = db.query(User).filter(User.tg_id == tg_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Пользователь не найден"
        )
    
    # Обновляем поля пользователя
    if user_update.bio is not None:
        user.bio = user_update.bio
    if user_update.main_role is not None:
        user.main_role = user_update.main_role
    if user_update.ready_to_work is not None:
        user.ready_to_work = user_update.ready_to_work
    
    # Обновляем навыки
    if user_update.skills is not None:
        # Удаляем старые навыки
        user.skills.clear()
        
        # Добавляем новые навыки
        for skill_name in user_update.skills:
            skill = db.query(Skill).filter(Skill.name == skill_name).first()
            if not skill:
                skill = Skill(name=skill_name)
                db.add(skill)
                db.flush()  # Получаем ID без commit
            user.skills.append(skill)
    
    db.commit()
    db.refresh(user)
    return user


@router.get("/", response_model=List[UserListResponse])
def get_users(
    skip: int = 0,
    limit: int = 100,
    role: Optional[str] = None,
    ready_to_work: Optional[bool] = None,
    db: Session = Depends(get_db)
):
    """Получить список пользователей с фильтрацией"""
    query = db.query(User)
    
    if role:
        query = query.filter(User.main_role == role)
    if ready_to_work is not None:
        query = query.filter(User.ready_to_work == ready_to_work)
    
    users = query.offset(skip).limit(limit).all()
    return users


@router.get("/{user_id}", response_model=UserResponse)
def get_user(user_id: int, db: Session = Depends(get_db)):
    """Получить информацию о пользователе по ID"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Пользователь не найден"
        )
    return user


@router.get("/skills/", response_model=List[SkillResponse])
def get_all_skills(db: Session = Depends(get_db)):
    """Получить список всех навыков"""
    skills = db.query(Skill).all()
    return skills


@router.post("/achievements/", response_model=AchievementResponse)
def create_achievement(
    tg_id: int,
    achievement_data: dict,
    db: Session = Depends(get_db)
):
    """Добавить достижение пользователю"""
    user = db.query(User).filter(User.tg_id == tg_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Пользователь не найден"
        )
    
    achievement = Achievement(
        user_id=user.id,
        hackathon_name=achievement_data["hackathon_name"],
        place=achievement_data.get("place"),
        team_name=achievement_data["team_name"],
        project_link=achievement_data.get("project_link"),
        year=achievement_data["year"],
        description=achievement_data.get("description", "")
    )
    
    db.add(achievement)
    db.commit()
    db.refresh(achievement)
    return achievement