from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models import Team, User, Hackathon, JoinRequest, RequestStatus
from app.schemas.team import TeamCreate, TeamUpdate, TeamRead
from app.schemas.request import JoinRequestCreate, JoinRequestResponse
from app.core.auth import get_current_user

router = APIRouter(prefix="/teams", tags=["teams"])


@router.post("/{hackathon_id}", response_model=TeamRead, status_code=status.HTTP_201_CREATED)
async def create_team(
    hackathon_id: int,
    team_data: TeamCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Создать новую команду
    
    Текущий пользователь автоматически становится капитаном команды.
    Требуется JWT авторизация (Bearer token в заголовке Authorization).
    """
    # Проверяем, что хакатон существует
    hackathon = db.query(Hackathon).filter(Hackathon.id == hackathon_id).first()
    if not hackathon:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Хакатон не найден"
        )

    # Проверяем, что пользователь еще не капитан команды в этом хакатоне
    existing_team = db.query(Team).filter(
        Team.hackathon_id == hackathon_id,
        Team.captain_id == current_user.id
    ).first()
    if existing_team:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Вы уже являетесь капитаном команды в этом хакатоне"
        )

    # Создаем команду с current_user как капитаном
    team = Team(
        name=team_data.name,
        description=team_data.description or "",
        hackathon_id=hackathon_id,
        captain_id=current_user.id,  # ID из JWT токена
        is_looking=True
    )
    
    db.add(team)
    db.commit()
    db.refresh(team)
    
    # Добавляем капитана в команду
    current_user.team_id = team.id
    db.commit()
    db.refresh(team)
    
    return team


@router.get("/", response_model=List[TeamRead])
def get_teams(
    skip: int = 0,
    limit: int = 100,
    hackathon_id: Optional[int] = None,
    is_looking: Optional[bool] = None,
    db: Session = Depends(get_db)
):
    """Получить список команд с фильтрацией"""
    query = db.query(Team)
    
    if hackathon_id:
        query = query.filter(Team.hackathon_id == hackathon_id)
    if is_looking is not None:
        query = query.filter(Team.is_looking == is_looking)
    
    teams = query.offset(skip).limit(limit).all()
    return teams


@router.get("/{team_id}", response_model=TeamRead)
def get_team(team_id: int, db: Session = Depends(get_db)):
    """Получить информацию о команде по ID"""
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Команда не найдена"
        )
    return team


@router.put("/{team_id}", response_model=TeamRead)
async def update_team(
    team_id: int,
    team_update: TeamUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Обновить информацию о команде
    
    Только капитан команды может редактировать её данные.
    Требуется JWT авторизация.
    """
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Команда не найдена"
        )
    
    # Проверяем, что текущий пользователь - капитан команды
    if team.captain_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Только капитан может редактировать команду"
        )
    
    # Обновляем поля
    update_data = team_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(team, field, value)
    
    db.commit()
    db.refresh(team)
    return team


@router.delete("/{team_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_team(
    team_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Удалить команду
    
    Только капитан команды может удалить её.
    При удалении все участники автоматически покидают команду.
    Требуется JWT авторизация.
    """
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Команда не найдена"
        )
    
    # Проверяем, что текущий пользователь - капитан команды
    if team.captain_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Только капитан может удалить команду"
        )
    
    # Убираем всех участников из команды
    db.query(User).filter(User.team_id == team_id).update({"team_id": None})
    
    db.delete(team)
    db.commit()


@router.post("/{team_id}/join", response_model=JoinRequestResponse)
async def join_team_request(
    team_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Подать заявку на вступление в команду
    
    Текущий пользователь (из JWT токена) подает заявку в указанную команду.
    Требуется JWT авторизация.
    """
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Команда не найдена"
        )
    
    # Проверяем, что пользователь еще не в команде
    if current_user.team_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Вы уже состоите в команде"
        )
    
    # Проверяем, что заявка еще не подана
    existing_request = db.query(JoinRequest).filter(
        JoinRequest.user_id == current_user.id,
        JoinRequest.team_id == team_id,
        JoinRequest.status == RequestStatus.pending
    ).first()
    
    if existing_request:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Заявка уже подана"
        )
    
    # Создаем заявку
    team_request = JoinRequest(
        user_id=current_user.id,
        team_id=team_id,
        status=RequestStatus.pending
    )
    
    db.add(team_request)
    db.commit()
    db.refresh(team_request)
    
    return team_request


@router.post("/{team_id}/invite", response_model=JoinRequestResponse)
async def invite_to_team(
    team_id: int,
    invited_user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Пригласить пользователя в команду
    
    Только капитан команды может отправлять приглашения.
    Требуется JWT авторизация.
    """
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Команда не найдена"
        )
    
    # Проверяем, что текущий пользователь - капитан команды
    if team.captain_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Только капитан может приглашать в команду"
        )
    
    invited_user = db.query(User).filter(User.id == invited_user_id).first()
    if not invited_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Приглашаемый пользователь не найден"
        )
    
    # Проверяем, что пользователь еще не в команде
    if invited_user.team_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Пользователь уже состоит в команде"
        )
    
    # Создаем приглашение
    team_request = JoinRequest(
        user_id=invited_user.id,
        team_id=team_id,
        status=RequestStatus.pending
    )
    
    db.add(team_request)
    db.commit()
    db.refresh(team_request)
    
    return team_request


@router.put("/requests/{request_id}", response_model=JoinRequestResponse)
async def handle_team_request(
    request_id: int,
    action: str,  # "accept" или "decline"
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Принять или отклонить заявку/приглашение
    
    Капитан команды может принимать/отклонять заявки от пользователей.
    Пользователь может отклонить приглашение в команду.
    Требуется JWT авторизация.
    
    Args:
        request_id: ID заявки
        action: "accept" или "decline"
        current_user: текущий пользователь из JWT
        db: сессия БД
    """
    team_request = db.query(JoinRequest).filter(JoinRequest.id == request_id).first()
    if not team_request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Заявка не найдена"
        )
    
    # Проверяем права на обработку заявки
    team = db.query(Team).filter(Team.id == team_request.team_id).first()
    if not team:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Команда не найдена"
        )
    
    # Капитан команды или сам пользователь могут обрабатывать заявку
    if team.captain_id != current_user.id and team_request.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Только капитан команды или сам пользователь может обрабатывать заявки"
        )
    
    # Обновляем статус
    if action == "accept":
        team_request.status = RequestStatus.accepted
        # Добавляем пользователя в команду
        request_user = db.query(User).filter(User.id == team_request.user_id).first()
        request_user.team_id = team_request.team_id
    elif action == "decline":
        team_request.status = RequestStatus.declined
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Действие должно быть 'accept' или 'decline'"
        )
    
    db.commit()
    db.refresh(team_request)
    
    return team_request


@router.get("/{team_id}/requests", response_model=List[JoinRequestResponse])
async def get_team_requests(
    team_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Получить список заявок в команду
    
    Только капитан команды может просматривать заявки.
    Требуется JWT авторизация.
    """
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Команда не найдена"
        )
    
    # Проверяем, что текущий пользователь - капитан команды
    if team.captain_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Только капитан может просматривать заявки"
        )
    
    requests = db.query(JoinRequest).filter(
        JoinRequest.team_id == team_id,
        JoinRequest.status == RequestStatus.pending
    ).all()
    
    return requests


@router.post("/{team_id}/leave", status_code=status.HTTP_204_NO_CONTENT)
async def leave_team(
    team_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Покинуть команду
    
    Текущий пользователь покидает команду.
    Капитан не может покинуть команду (нужно удалить команду или передать капитанство).
    Требуется JWT авторизация.
    """
    if current_user.team_id != team_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Вы не состоите в этой команде"
        )
    
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Команда не найдена"
        )
    
    if team.captain_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Капитан не может покинуть команду. Удалите команду или передайте капитанство."
        )
    
    current_user.team_id = None
    db.commit()
