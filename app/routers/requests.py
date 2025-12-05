from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models import Request, User, Team, Hackathon, RequestStatus, RequestType
from app.schemas.request import RequestCreate, RequestResponse
from app.schemas.request_update import RequestUpdate
from app.schemas.request_status_enum import RequestStatusEnum
from app.schemas.request_type_enum import RequestTypeEnum

router = APIRouter(prefix="/requests", tags=["requests"])


@router.post("/", response_model=RequestResponse, status_code=status.HTTP_201_CREATED)
def create_request(
    request_data: RequestCreate,
    sender_tg_id: int,
    db: Session = Depends(get_db)
):
    """Создать новый запрос (на сотрудничество, вступление в команду и т.д.)"""
    # Проверяем, что отправитель существует
    sender = db.query(User).filter(User.tg_id == sender_tg_id).first()
    if not sender:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Отправитель не найден"
        )
    
    # Проверяем, что хакатон существует
    hackathon = db.query(Hackathon).filter(Hackathon.id == request_data.hackathon_id).first()
    if not hackathon:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Хакатон не найден"
        )
    
    # Проверяем получателя, если указан
    if request_data.receiver_id:
        receiver = db.query(User).filter(User.id == request_data.receiver_id).first()
        if not receiver:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Получатель не найден"
            )
    
    # Проверяем команду, если указана
    if request_data.team_id:
        team = db.query(Team).filter(Team.id == request_data.team_id).first()
        if not team:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Команда не найдена"
            )
    
    # Создаем запрос
    request = Request(
        sender_id=sender.id,
        receiver_id=request_data.receiver_id,
        team_id=request_data.team_id,
        hackathon_id=request_data.hackathon_id,
        request_type=RequestType(request_data.request_type.value),
        status=RequestStatus.pending
    )
    
    db.add(request)
    db.commit()
    db.refresh(request)
    
    return request


@router.get("/", response_model=List[RequestResponse])
def get_requests(
    skip: int = 0,
    limit: int = 100,
    user_tg_id: Optional[int] = None,
    hackathon_id: Optional[int] = None,
    request_type: Optional[str] = None,
    status_filter: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Получить список запросов с фильтрацией"""
    query = db.query(Request)
    
    # Фильтр по пользователю (отправленные или полученные)
    if user_tg_id:
        user = db.query(User).filter(User.tg_id == user_tg_id).first()
        if user:
            query = query.filter(
                (Request.sender_id == user.id) | (Request.receiver_id == user.id)
            )
    
    # Фильтр по хакатону
    if hackathon_id:
        query = query.filter(Request.hackathon_id == hackathon_id)
    
    # Фильтр по типу запроса
    if request_type:
        try:
            request_type_enum = RequestType(request_type)
            query = query.filter(Request.request_type == request_type_enum)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Неверный тип запроса: {request_type}"
            )
    
    # Фильтр по статусу
    if status_filter:
        try:
            status_enum = RequestStatus(status_filter)
            query = query.filter(Request.status == status_enum)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Неверный статус: {status_filter}"
            )
    
    requests = query.offset(skip).limit(limit).all()
    return requests


@router.get("/sent", response_model=List[RequestResponse])
def get_sent_requests(
    user_tg_id: int,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Получить запросы, отправленные пользователем"""
    user = db.query(User).filter(User.tg_id == user_tg_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Пользователь не найден"
        )
    
    requests = db.query(Request).filter(
        Request.sender_id == user.id
    ).offset(skip).limit(limit).all()
    
    return requests


@router.get("/received", response_model=List[RequestResponse])
def get_received_requests(
    user_tg_id: int,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Получить запросы, полученные пользователем"""
    user = db.query(User).filter(User.tg_id == user_tg_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Пользователь не найден"
        )
    
    requests = db.query(Request).filter(
        Request.receiver_id == user.id
    ).offset(skip).limit(limit).all()
    
    return requests


@router.get("/{request_id}", response_model=RequestResponse)
def get_request(request_id: int, db: Session = Depends(get_db)):
    """Получить информацию о запросе по ID"""
    request = db.query(Request).filter(Request.id == request_id).first()
    if not request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Запрос не найден"
        )
    return request


@router.put("/{request_id}", response_model=RequestResponse)
def update_request(
    request_id: int,
    request_update: RequestUpdate,
    user_tg_id: int,
    db: Session = Depends(get_db)
):
    """Обновить статус запроса (принять/отклонить)"""
    request = db.query(Request).filter(Request.id == request_id).first()
    if not request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Запрос не найден"
        )
    
    user = db.query(User).filter(User.tg_id == user_tg_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Пользователь не найден"
        )
    
    # Проверяем права на обновление запроса
    can_update = False
    
    # Отправитель может отменить свой запрос
    if request.sender_id == user.id and request_update.status == RequestStatusEnum.canceled:
        can_update = True
    
    # Получатель может принять или отклонить запрос
    elif request.receiver_id == user.id and request_update.status in [RequestStatusEnum.accepted, RequestStatusEnum.declined]:
        can_update = True
    
    # Капитан команды может принять или отклонить запрос на вступление в команду
    elif request.team_id and request.request_type == RequestType.join_team:
        team = db.query(Team).filter(Team.id == request.team_id).first()
        if team and team.captain_id == user.id and request_update.status in [RequestStatusEnum.accepted, RequestStatusEnum.declined]:
            can_update = True
    
    if not can_update:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="У вас нет прав для обновления этого запроса"
        )
    
    # Обновляем статус
    if request_update.status:
        request.status = RequestStatus(request_update.status.value)
        
        # Если запрос на вступление в команду принят, добавляем пользователя в команду
        if (request.request_type == RequestType.join_team and 
            request_update.status == RequestStatusEnum.accepted and 
            request.team_id):
            sender = db.query(User).filter(User.id == request.sender_id).first()
            if sender:
                sender.team_id = request.team_id
    
    db.commit()
    db.refresh(request)
    
    return request


@router.delete("/{request_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_request(
    request_id: int,
    user_tg_id: int,
    db: Session = Depends(get_db)
):
    """Удалить запрос (только отправитель)"""
    request = db.query(Request).filter(Request.id == request_id).first()
    if not request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Запрос не найден"
        )
    
    user = db.query(User).filter(User.tg_id == user_tg_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Пользователь не найден"
        )
    
    # Только отправитель может удалить запрос
    if request.sender_id != user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Только отправитель может удалить запрос"
        )
    
    db.delete(request)
    db.commit()


@router.get("/team/{team_id}", response_model=List[RequestResponse])
def get_team_requests(
    team_id: int,
    captain_tg_id: int,
    db: Session = Depends(get_db)
):
    """Получить запросы к команде (только капитан)"""
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
            detail="Только капитан может просматривать запросы к команде"
        )
    
    requests = db.query(Request).filter(
        Request.team_id == team_id,
        Request.request_type == RequestType.join_team,
        Request.status == RequestStatus.pending
    ).all()
    
    return requests


@router.post("/collaborate", response_model=RequestResponse)
def create_collaboration_request(
    receiver_id: int,
    hackathon_id: int,
    sender_tg_id: int,
    db: Session = Depends(get_db)
):
    """Создать запрос на сотрудничество"""
    sender = db.query(User).filter(User.tg_id == sender_tg_id).first()
    if not sender:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Отправитель не найден"
        )
    
    receiver = db.query(User).filter(User.id == receiver_id).first()
    if not receiver:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Получатель не найден"
        )
    
    # Проверяем, что нет активного запроса на сотрудничество
    existing_request = db.query(Request).filter(
        Request.sender_id == sender.id,
        Request.receiver_id == receiver_id,
        Request.hackathon_id == hackathon_id,
        Request.request_type == RequestType.collaborate,
        Request.status == RequestStatus.pending
    ).first()
    
    if existing_request:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Запрос на сотрудничество уже отправлен"
        )
    
    # Создаем запрос
    request = Request(
        sender_id=sender.id,
        receiver_id=receiver_id,
        hackathon_id=hackathon_id,
        request_type=RequestType.collaborate,
        status=RequestStatus.pending
    )
    
    db.add(request)
    db.commit()
    db.refresh(request)
    
    return request
