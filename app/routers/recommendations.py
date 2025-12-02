"""
Роутер для рекомендательной системы на основе навыков и ролей
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from starlette.requests import Request as StarletteRequest
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func

from app.database import get_db
from app.models import User, Team, Skill, Request as RequestModel, RequestStatus, RequestType
from app.schemas import (
    RecommendationRequest, 
    RecommendationResponse, 
    UserResponse, 
    TeamResponse
)

router = APIRouter(
    prefix="/recommendations",
    tags=["recommendations"]
)


def get_current_user_from_request(http_request: StarletteRequest) -> User:
    """Получить текущего пользователя из request.state"""
    if not hasattr(http_request, 'state') or not hasattr(http_request.state, 'user'):
        raise HTTPException(status_code=401, detail="User not authenticated")
    return http_request.state.user


def calculate_skill_match(user_skills: set, preferred_skills: List[str]) -> float:
    """
    Рассчитать процент совпадения навыков
    
    Args:
        user_skills: set с названиями навыков пользователя/команды
        preferred_skills: список предпочитаемых навыков
    
    Returns:
        float: процент совпадения (0-1)
    """
    if not preferred_skills:
        return 1.0
    
    matches = len(user_skills & set(preferred_skills))
    return matches / len(preferred_skills)


@router.post("/", response_model=RecommendationResponse)
async def get_recommendations(
    http_request: StarletteRequest,
    rec_request: RecommendationRequest,
    db: Session = Depends(get_db)
):
    """
    Получить рекомендации для пользователя или команды
    
    **Параметры:**
    - **for_what**: "team" (рекомендации команд для пользователя) или "user" (рекомендации пользователей для команды)
    - **preferred_roles**: Список предпочитаемых ролей (backend, frontend, design, pm, analyst)
    - **preferred_skills**: Список предпочитаемых навыков
    - **exclude_team_ids**: Список ID команд для исключения
    - **exclude_user_ids**: Список ID пользователей для исключения
    - **hackathon_id**: ID хакатона для фильтрации
    
    **Логика:**
    - Если for_what="team": найти команды, которые ищут пользователя с навыками current_user
    - Если for_what="user": найти пользователей, которые подходят для team_id текущего пользователя
    """
    current_user = get_current_user_from_request(http_request)
    
    exclude_team_ids = rec_request.exclude_team_ids or []
    exclude_user_ids = rec_request.exclude_user_ids or []
    
    if rec_request.for_what == "team":
        # ===== РЕКОМЕНДАЦИИ КОМАНД ПОЛЬЗОВАТЕЛЮ =====
        # Логика: найти активные команды, которые:
        # 1. В том же хакатоне
        # 2. Не содержат текущего пользователя
        # 3. Не в списке исключений
        # 4. Нуждаются в навыках/роли текущего пользователя
        
        # Получить навыки текущего пользователя
        current_user_skills = db.query(Skill).join(
            Skill.users
        ).filter(User.id == current_user.id).all()
        current_user_skill_names = {s.name for s in current_user_skills}
        current_user_role = current_user.main_role
        
        # Получить команды для фильтрации
        teams_query = db.query(Team).filter(
            and_(
                Team.hackathon_id == rec_request.hackathon_id,
                Team.id.notin_(exclude_team_ids) if exclude_team_ids else True,
                # Команда не содержит текущего пользователя
                ~Team.members.any(User.id == current_user.id)
            )
        )
        
        teams = teams_query.all()
        recommended_teams = []
        
        for team in teams:
            team_member_skills = set()
            team_member_roles = set()
            
            # Собрать все навыки и роли в команде
            for member in team.members:
                if member.main_role:
                    team_member_roles.add(member.main_role)
                for skill in member.skills:
                    team_member_skills.add(skill.name)
            
            # Оценка: ищем команду, которой НЕ хватает навыков текущего пользователя
            # или которой нужна его роль
            missing_current_skills = current_user_skill_names - team_member_skills
            team_lacks_role = current_user_role and current_user_role not in team_member_roles
            
            # Если команда может получить пользу от навыков/роли пользователя
            if missing_current_skills or team_lacks_role:
                score = 0
                
                # Оценка за недостающие навыки
                if current_user_skill_names:
                    missing_score = len(missing_current_skills) / len(current_user_skill_names)
                    score += missing_score * 0.6  # 60% от оценки
                
                # Оценка за роль
                if team_lacks_role:
                    score += 0.4  # 40% от оценки
                
                recommended_teams.append({
                    'team': team,
                    'score': score
                })
        
        # Сортировать по оценке и вернуть top 10
        recommended_teams.sort(key=lambda x: x['score'], reverse=True)
        top_teams = [item['team'] for item in recommended_teams[:10]]
        
        return RecommendationResponse(recommended_teams=top_teams)
    
    elif rec_request.for_what == "user":
        # ===== РЕКОМЕНДАЦИИ ПОЛЬЗОВАТЕЛЕЙ КОМАНДЕ =====
        # Логика: найти активных пользователей, которые:
        # 1. В том же хакатоне
        # 2. Не в той же команде что и текущий пользователь
        # 3. Не в списке исключений
        # 4. Имеют нужные навыки/роли
        
        # Найти команду, где текущий пользователь капитан
        # (капитан может быть в команде или быть создателем)
        user_team = db.query(Team).filter(Team.captain_id == current_user.id).first()
        
        if not user_team:
            raise HTTPException(
                status_code=400,
                detail="User must be a team captain to get user recommendations"
            )
        
        # Собрать потребности команды
        team_member_skills = set()
        team_member_roles = set()
        
        for member in user_team.members:
            if member.main_role:
                team_member_roles.add(member.main_role)
            for skill in member.skills:
                team_member_skills.add(skill.name)
        
        # Получить пользователей для рекомендации
        users_query = db.query(User).filter(
            and_(
                # Не в той же команде
                User.team_id != current_user.team_id,
                # Не в списке исключений
                User.id.notin_(exclude_user_ids) if exclude_user_ids else True,
                # Готовы работать
                User.ready_to_work == True,
                # Не сами (не текущий пользователь)
                User.id != current_user.id
            )
        )
        
        users = users_query.all()
        recommended_users = []
        
        for user in users:
            user_skills = {s.name for s in user.skills}
            user_role = user.main_role
            
            # Оценка: ищем пользователей с нужными навыками/ролями
            skill_match_score = 0
            if user_skills and rec_request.preferred_skills:
                skill_match_score = calculate_skill_match(user_skills, rec_request.preferred_skills)
            elif user_skills and team_member_skills:
                # Если preferred_skills не указаны, ищем дополнительные навыки
                additional_skills = user_skills - team_member_skills
                if team_member_skills:
                    skill_match_score = len(additional_skills) / len(team_member_skills) if team_member_skills else 0
                else:
                    skill_match_score = 1.0 if user_skills else 0.5
            
            # Оценка за роль
            role_match_score = 0
            if rec_request.preferred_roles:
                role_match_score = 1.0 if user_role in rec_request.preferred_roles else 0.3
            elif user_role and user_role not in team_member_roles:
                # Если preferred_roles не указаны, ищем отсутствующие роли
                role_match_score = 1.0
            else:
                role_match_score = 0.5
            
            # Общая оценка
            total_score = (skill_match_score * 0.6) + (role_match_score * 0.4)
            
            # Добавить если оценка > 0.3 (минимальный порог)
            if total_score > 0.3:
                recommended_users.append({
                    'user': user,
                    'score': total_score
                })
        
        # Сортировать по оценке и вернуть top 10
        recommended_users.sort(key=lambda x: x['score'], reverse=True)
        top_users = [item['user'] for item in recommended_users[:10]]
        
        return RecommendationResponse(recommended_users=top_users)
    
    else:
        raise HTTPException(
            status_code=400,
            detail="for_what must be 'team' or 'user'"
        )


@router.post("/teams/{team_id}", response_model=RecommendationResponse)
async def get_team_recommendations(
    http_request: StarletteRequest,
    team_id: int,
    rec_request: RecommendationRequest,
    db: Session = Depends(get_db)
):
    """
    Получить рекомендации пользователей для конкретной команды
    (Альтернативный эндпоинт для явного указания ID команды)
    
    Требуется быть капитаном команды
    """
    current_user = get_current_user_from_request(http_request)
    
    # Получить команду
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    
    # Проверить, что текущий пользователь капитан
    if team.captain_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="Only team captain can request recommendations for this team"
        )
    
    # Собрать потребности команды
    team_member_skills = set()
    team_member_roles = set()
    team_member_ids = set()
    
    for member in team.members:
        team_member_ids.add(member.id)
        if member.main_role:
            team_member_roles.add(member.main_role)
        for skill in member.skills:
            team_member_skills.add(skill.name)
    
    exclude_user_ids = list(team_member_ids)  # Исключить текущих членов
    if rec_request.exclude_user_ids:
        exclude_user_ids.extend(rec_request.exclude_user_ids)
    
    # Получить пользователей для рекомендации
    users_query = db.query(User).filter(
        and_(
            User.id.notin_(exclude_user_ids),
            User.ready_to_work == True,
            User.id != current_user.id
        )
    )
    
    users = users_query.all()
    recommended_users = []
    
    for user in users:
        user_skills = {s.name for s in user.skills}
        user_role = user.main_role
        
        # Оценка: ищем пользователей с нужными навыками/ролями
        skill_match_score = 0
        if user_skills and rec_request.preferred_skills:
            skill_match_score = calculate_skill_match(user_skills, rec_request.preferred_skills)
        elif user_skills and team_member_skills:
            additional_skills = user_skills - team_member_skills
            skill_match_score = len(additional_skills) / len(team_member_skills) if team_member_skills else 1.0
        else:
            skill_match_score = 0.5
        
        # Оценка за роль
        role_match_score = 0
        if rec_request.preferred_roles:
            role_match_score = 1.0 if user_role in rec_request.preferred_roles else 0.3
        elif user_role and user_role not in team_member_roles:
            role_match_score = 1.0
        else:
            role_match_score = 0.5
        
        # Общая оценка
        total_score = (skill_match_score * 0.6) + (role_match_score * 0.4)
        
        # Добавить если оценка > 0.3
        if total_score > 0.3:
            recommended_users.append({
                'user': user,
                'score': total_score
            })
    
    # Сортировать по оценке и вернуть top 10
    recommended_users.sort(key=lambda x: x['score'], reverse=True)
    top_users = [item['user'] for item in recommended_users[:10]]
    
    return RecommendationResponse(recommended_users=top_users)
