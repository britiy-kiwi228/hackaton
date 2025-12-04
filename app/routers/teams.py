from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models import Team, User, Hackathon, TeamRequest, RequestStatus
from app.schemas import (
    TeamCreate, TeamUpdate, TeamResponse, TeamListResponse,
    TeamRequestCreate, TeamRequestResponse
)

router = APIRouter(prefix="/teams", tags=["teams"])


@router.post("/", response_model=TeamResponse, status_code=status.HTTP_201_CREATED)
def create_team(
    team_data: TeamCreate,
    captain_tg_id: int,
    db: Session = Depends(get_db)
):
    """Создать новую команду"""
    # Проверяем, что капитан существует
    captain = db.query(User).filter(User.tg_id == captain_tg_id).first()
    if not captain:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Капитан команды не найден"
        )
    
    # Проверяем, что хакатон существует
    hackathon = db.query(Hackathon).filter(Hackathon.id == team_data.hackathon_id).first()
    if not hackathon:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Хакатон не найден"
        )
    
    # Проверяем, что капитан еще не в команде этого хакатона
    existing_team = db.query(Team).filter(
        Team.hackathon_id == team_data.hackathon_id,
        Team.captain_id == captain.id
    ).first()
    if existing_team:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Вы уже являетесь капитаном команды в этом хакатоне"
        )
    
    # Создаем команду
    team = Team(
        name=team_data.name,
        description=team_data.description or "",
        hackathon_id=team_data.hackathon_id,
        captain_id=captain.id,
        is_looking=True
    )
    
    db.add(team)
    db.commit()
    db.refresh(team)
    
    # Добавляем капитана в команду
    captain.team_id = team.id
    db.commit()
    db.refresh(team)
    
    return team


@router.get("/", response_model=List[TeamListResponse])
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


@router.get("/{team_id}", response_model=TeamResponse)
def get_team(team_id: int, db: Session = Depends(get_db)):
    """Получить информацию о команде по ID"""
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Команда не найдена"
        )
    return team


@router.put("/{team_id}", response_model=TeamResponse)
def update_team(
    team_id: int,
    team_update: TeamUpdate,
    captain_tg_id: int,
    db: Session = Depends(get_db)
):
    """Обновить информацию о команде (только капитан)"""
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Команда не найдена"
        )
    
    # Проверяем, что пользователь - капитан команды
    captain = db.query(User).filter(User.tg_id == captain_tg_id).first()
    if not captain or team.captain_id != captain.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Только капитан может редактировать команду"
        )
    
    # Обновляем поля
    update_data = team_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(team, field, value)
    
    db.commit()
    db.refresh(team)
    return team


@router.delete("/{team_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_team(
    team_id: int,
    captain_tg_id: int,
    db: Session = Depends(get_db)
):
    """Удалить команду (только капитан)"""
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Команда не найдена"
        )
    
    # Проверяем, что пользователь - капитан команды
    captain = db.query(User).filter(User.tg_id == captain_tg_id).first()
    if not captain or team.captain_id != captain.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Только капитан может удалить команду"
        )
    
    # Убираем всех участников из команды
    db.query(User).filter(User.team_id == team_id).update({"team_id": None})
    
    db.delete(team)
    db.commit()


@router.post("/{team_id}/join", response_model=TeamRequestResponse)
def join_team_request(
    team_id: int,
    user_tg_id: int,
    db: Session = Depends(get_db)
):
    """Подать заявку на вступление в команду"""
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Команда не найдена"
        )
    
    user = db.query(User).filter(User.tg_id == user_tg_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Пользователь не найден"
        )
    
    # Проверяем, что пользователь еще не в команде
    if user.team_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Вы уже состоите в команде"
        )
    
    # Проверяем, что заявка еще не подана
    existing_request = db.query(TeamRequest).filter(
        TeamRequest.user_id == user.id,
        TeamRequest.team_id == team_id,
        TeamRequest.status == RequestStatus.pending
    ).first()
    
    if existing_request:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Заявка уже подана"
        )
    
    # Создаем заявку
    team_request = TeamRequest(
        user_id=user.id,
        team_id=team_id,
        is_invite=False,
        status=RequestStatus.pending
    )
    
    db.add(team_request)
    db.commit()
    db.refresh(team_request)
    
    return team_request


@router.post("/{team_id}/invite", response_model=TeamRequestResponse)
def invite_to_team(
    team_id: int,
    invited_user_id: int,
    captain_tg_id: int,
    db: Session = Depends(get_db)
):
    """Пригласить пользователя в команду (только капитан)"""
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Команда не найдена"
        )
    
    captain = db.query(User).filter(User.tg_id == captain_tg_id).first()
    if not captain or team.captain_id != captain.id:
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
    team_request = TeamRequest(
        user_id=invited_user.id,
        team_id=team_id,
        is_invite=True,
        status=RequestStatus.pending
    )
    
    db.add(team_request)
    db.commit()
    db.refresh(team_request)
    
    return team_request


@router.put("/requests/{request_id}", response_model=TeamRequestResponse)
def handle_team_request(
    request_id: int,
    action: str,  # "accept" или "decline"
    user_tg_id: int,
    db: Session = Depends(get_db)
):
    """Принять или отклонить заявку/приглашение"""
    team_request = db.query(TeamRequest).filter(TeamRequest.id == request_id).first()
    if not team_request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Заявка не найдена"
        )
    
    user = db.query(User).filter(User.tg_id == user_tg_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Пользователь не найден"
        )
    
    # Проверяем права на обработку заявки
    if team_request.is_invite:
        # Приглашение может принять только приглашенный пользователь
        if team_request.user_id != user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Вы можете обрабатывать только свои приглашения"
            )
    else:
        # Заявку может принять только капитан команды
        team = db.query(Team).filter(Team.id == team_request.team_id).first()
        if team.captain_id != user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Только капитан может обрабатывать заявки"
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


@router.get("/{team_id}/requests", response_model=List[TeamRequestResponse])
def get_team_requests(
    team_id: int,
    captain_tg_id: int,
    db: Session = Depends(get_db)
):
    """Получить список заявок в команду (только капитан)"""
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Команда не найдена"
        )
    
    captain = db.query(User).filter(User.tg_id == captain_tg_id).first()
    if not captain or team.captain_id != captain.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Только капитан может просматривать заявки"
        )
    
    requests = db.query(TeamRequest).filter(
        TeamRequest.team_id == team_id,
        TeamRequest.status == RequestStatus.pending
    ).all()
    
    return requests


@router.post("/{team_id}/leave", status_code=status.HTTP_204_NO_CONTENT)
def leave_team(
    team_id: int,
    user_tg_id: int,
    db: Session = Depends(get_db)
):
    """Покинуть команду"""
    user = db.query(User).filter(User.tg_id == user_tg_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Пользователь не найден"
        )
    
    if user.team_id != team_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Вы не состоите в этой команде"
        )
    
    team = db.query(Team).filter(Team.id == team_id).first()
    if team.captain_id == user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Капитан не может покинуть команду. Удалите команду или передайте капитанство."
        )
    
    user.team_id = None
    db.commit()