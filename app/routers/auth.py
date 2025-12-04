"""
Роутер аутентификации: Email/Password и Telegram
"""
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User
from app.schemas import TelegramAuthRequest, TokenResponse
from app.core.security import create_access_token
from app.core.config import settings
from app.utils.telegram import verify_telegram_auth
from app.dependencies.auth import authenticate_user, get_current_user

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=TokenResponse)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """
    Вход по Email/Password (для админки)
    
    OAuth2PasswordRequestForm ожидает поля:
    - username (используется как email)
    - password
    """
    user = await authenticate_user(
        email=form_data.username,
        password=form_data.password,
        db=db
    )
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Генерируем токен с дополнительной информацией о роли
    token = create_access_token(
        subject=user.id,
        extra_claims={
            "role": "admin" if user.is_admin else "user",
            "auth_type": "email"
        }
    )
    
    return TokenResponse(access_token=token, token_type="bearer")


@router.post("/telegram/login", response_model=TokenResponse)
def telegram_login(data: TelegramAuthRequest, db: Session = Depends(get_db)):
    """
    Вход через Telegram Login Widget
    
    Принимает данные от Telegram, проверяет подпись и создаёт/находит пользователя
    """
    auth_data = dict(data.auth_data)
    
    # 1) Верификация Telegram данных
    try:
        verify_telegram_auth(auth_data, ttl_seconds=settings.TELEGRAM_AUTH_TTL_SECONDS)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e),
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # 2) Извлекаем данные пользователя
    tg_id = int(auth_data["id"])
    
    # 3) Поиск или создание пользователя
    user = db.query(User).filter(User.tg_id == tg_id).first()
    
    if not user:
        # Создаём нового пользователя
        first_name = auth_data.get("first_name", "")
        last_name = auth_data.get("last_name", "")
        full_name = f"{first_name} {last_name}".strip() or "Telegram User"
        
        user = User(
            tg_id=tg_id,
            username=auth_data.get("username"),
            tg_username=auth_data.get("username"),
            full_name=full_name,
            bio="",
            main_role=None,
            ready_to_work=True,
            avatar_url=auth_data.get("photo_url"),
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    else:
        # Обновляем данные существующего пользователя
        user.username = auth_data.get("username")
        user.tg_username = auth_data.get("username")
        user.avatar_url = auth_data.get("photo_url") or user.avatar_url
        db.commit()
        db.refresh(user)
    
    # 4) Генерация JWT токена
    token = create_access_token(
        subject=user.id,
        extra_claims={
            "auth_type": "telegram",
            "tg_id": tg_id
        }
    )
    
    return TokenResponse(access_token=token, token_type="bearer")


@router.get("/me")
async def get_current_user_info(
    current_user: User = Depends(get_current_user)
):
    """
    Получить информацию о текущем залогиненном пользователе
    
    Требует JWT токен в заголовке Authorization: Bearer <token>
    """
    return {
        "id": current_user.id,
        "email": current_user.email,
        "tg_id": current_user.tg_id,
        "username": current_user.username,
        "full_name": current_user.full_name,
        "is_admin": current_user.is_admin,
        "created_at": current_user.created_at,
    }
