"""
Улучшенная рекомендательная система на основе навыков, ролей и метрик совместимости
"""
from typing import List, Set, Tuple
from fastapi import APIRouter, Depends, HTTPException
from starlette.requests import Request as StarletteRequest # Оставляем, если нужен для других целей
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func
from app.database import get_db
from app.models import User, Team, Skill, Request as RequestModel, RequestStatus, RequestType
from app.schemas import (
    RecommendationRequest,
    RecommendationResponse,
    UserResponse,
    TeamListResponse,
    EnhancedRecommendation
)
from app.utils.security import get_current_user # Импортируем новую зависимость

router = APIRouter(
    prefix="/recommendations",
    tags=["recommendations"]
)


# УБИРАЕМ СТАРУЮ ФУНКЦИЮ get_current_user_from_request
# def get_current_user_from_request(http_request: StarletteRequest) -> User:
#     """Получить текущего пользователя из request.state"""
#     if not hasattr(http_request, 'state') or not hasattr(http_request.state, 'user'):
#         raise HTTPException(status_code=401, detail="User not authenticated")
#     return http_request.state.user


def get_user_skills(user: User) -> Set[str]:
    """Получить набор навыков пользователя"""
    try:
        skills = user.skills or []
        return {skill.name.lower() for skill in skills if skill and skill.name}
    except Exception:
        return set()


def get_user_roles_in_team(team: Team) -> Set[str]:
    """Получить набор ролей в команде"""
    roles = set()
    try:
        members = team.members or []
        for member in members:
            try:
                if member.main_role:
                    role_value = member.main_role.value if hasattr(member.main_role, 'value') else str(member.main_role)
                    roles.add(role_value.lower())
            except Exception:
                continue
    except Exception:
        pass
    return roles


def get_team_skills(team: Team) -> Set[str]:
    """Получить набор всех навыков в команде"""
    skills = set()
    try:
        members = team.members or []
        for member in members:
            try:
                member_skills = member.skills or []
                for skill in member_skills:
                    if skill and skill.name:
                        skills.add(skill.name.lower())
            except Exception:
                continue
    except Exception:
        pass
    return skills


def calculate_skill_coverage(user_skills: Set[str], needed_skills: Set[str]) -> float:
    """
    Рассчитать, какой процент нужных навыков покрывает пользователь

    Args:
        user_skills: набор навыков пользователя
        needed_skills: набор нужных навыков

    Returns:
        float: процент покрытия (0.0 - 1.0)
    """
    if not needed_skills:
        return 1.0 if not user_skills else 0.5  # Нейтральная оценка если нет требований

    matches = len(user_skills & needed_skills)
    return matches / len(needed_skills)


def calculate_role_match(user_role: str, needed_roles: Set[str]) -> float:
    """
    Рассчитать совпадение роли

    Args:
        user_role: роль пользователя
        needed_roles: набор нужных ролей

    Returns:
        float: оценка совпадения (0.0 - 1.0)
    """
    if not needed_roles:
        return 0.5  # Нейтральная оценка если нет требований

    if not user_role:
        return 0.0

    return 1.0 if user_role.lower() in needed_roles else 0.3


def calculate_team_compatibility(
    user: User,
    team: Team,
    preferred_roles: List[str] = None,
    preferred_skills: List[str] = None
) -> Tuple[float, List[str]]:
    """
    Рассчитать совместимость пользователя с командой

    Алгоритм:
    1. Получить навыки, которые есть у пользователя
    2. Получить навыки, которые уже есть в команде
    3. Получить недостающие навыки (потребности команды)
    4. Рассчитать, сколько недостающих навыков может покрыть пользователь
    5. Добавить бонус, если роль пользователя отсутствует в команде

    Returns:
        Tuple[совместимость (0.0-1.0), список причин рекомендации]
    """
    user_skills = get_user_skills(user)
    team_skills = get_team_skills(team)
    team_roles = get_user_roles_in_team(team)

    # Преобразовать предпочтения в нижний регистр
    pref_skills = set(s.lower() for s in (preferred_skills or []))
    pref_roles = set(r.lower() for r in (preferred_roles or []))

    # Определить нужные навыки
    # 1. Если есть preferred_skills, ищем их
    # 2. Иначе ищем навыки, которых нет в команде
    if pref_skills:
        needed_skills = pref_skills
    else:
        needed_skills = user_skills - team_skills if user_skills else set()

    reasons = []
    score = 0.0

    # Оценка за навыки (60% веса)
    skill_score = calculate_skill_coverage(user_skills, needed_skills)
    score += skill_score * 0.6

    if skill_score > 0:
        skill_count = len(user_skills & needed_skills)
        reasons.append(f"Может покрыть {skill_count} навык(и)")

    # Оценка за роль (40% веса)
    if user.main_role:
        if pref_roles:
            role_score = 1.0 if user.main_role.lower() in pref_roles else 0.0
        else:
            role_score = 1.0 if user.main_role.lower() not in team_roles else 0.3

        score += role_score * 0.4

        if role_score > 0.5:
            reasons.append(f"Нужна роль '{user.main_role}'")

    # Бонус за готовность работать
    if user.ready_to_work:
        score = min(1.0, score + 0.05)
        reasons.append("Готов работать")

    return min(1.0, score), reasons


def calculate_user_compatibility(
    candidate: User,
    preferred_roles: List[str] = None,
    preferred_skills: List[str] = None
) -> Tuple[float, List[str]]:
    """
    Рассчитать совместимость кандидата с требованиями команды

    Алгоритм:
    1. Получить навыки кандидата
    2. Получить роль кандидата
    3. Проверить совпадение с preferred_skills и preferred_roles

    Returns:
        Tuple[совместимость (0.0-1.0), список причин рекомендации]
    """
    candidate_skills = get_user_skills(candidate)

    # Преобразовать требования
    pref_skills = set(s.lower() for s in (preferred_skills or []))
    pref_roles = set(r.lower() for r in (preferred_roles or []))

    reasons = []
    score = 0.0

    # Оценка за навыки (60% веса)
    if pref_skills:
        skill_score = calculate_skill_coverage(candidate_skills, pref_skills)
        score += skill_score * 0.6

        matched_skills = candidate_skills & pref_skills
        if matched_skills:
            reasons.append(f"Имеет {len(matched_skills)} требуемый(е) навык(и)")
    else:
        # Если нет предпочтений, оценить просто наличие навыков
        score += 0.3 if candidate_skills else 0.0

    # Оценка за роль (40% веса)
    if pref_roles:
        if candidate.main_role:
            role_score = 1.0 if candidate.main_role.lower() in pref_roles else 0.0
        else:
            role_score = 0.0
        score += role_score * 0.4

        if role_score > 0:
            reasons.append(f"Роль '{candidate.main_role}' соответствует")
    else:
        # Если нет требований по ролям, оценить просто наличие роли
        if candidate.main_role:
            score += 0.2
            reasons.append(f"Специалист в '{candidate.main_role}'")

    # Бонус за готовность работать
    if candidate.ready_to_work:
        score = min(1.0, score + 0.1)
        reasons.append("Активно ищет команду")

    return min(1.0, score), reasons



@router.post("/", response_model=RecommendationResponse)
async def get_recommendations(
    # http_request: StarletteRequest, # Убираем
    rec_request: RecommendationRequest,
    current_user: User = Depends(get_current_user), # Добавляем
    db: Session = Depends(get_db)
):
    """
    Получить рекомендации для пользователя или команды с детальной оценкой совместимости

    **Параметры:**
    - **for_what**: "team" (рекомендации команд для пользователя) или "user" (рекомендации пользователей для команды)
    - **preferred_roles**: Список предпочитаемых ролей
    - **preferred_skills**: Список предпочитаемых навыков
    - **exclude_team_ids**: Список ID команд для исключения
    - **exclude_user_ids**: Список ID пользователей для исключения
    - **hackathon_id**: ID хакатона для фильтрации
    - **max_results**: Максимальное количество результатов (по умолчанию 10)
    - **min_score**: Минимальная оценка совместимости (0.0-1.0, по умолчанию 0.3)
    """
    try:
        # current_user = get_current_user_from_request(http_request) # Убираем
        # current_user уже получен из JWT

        exclude_team_ids = rec_request.exclude_team_ids or []
        exclude_user_ids = rec_request.exclude_user_ids or []

        if rec_request.for_what == "team":
            # ===== РЕКОМЕНДАЦИИ КОМАНД ПОЛЬЗОВАТЕЛЮ =====

            # Получить команды, в которых пользователь не состоит
            teams_query = db.query(Team).filter(
                and_(
                    Team.hackathon_id == rec_request.hackathon_id,
                    Team.id.notin_(exclude_team_ids) if exclude_team_ids else True
                )
            )

            teams = teams_query.all()

            # Фильтруем команды, в которых пользователь уже состоит
            filtered_teams = []
            for t in teams:
                try:
                    # Безопасно получаем members
                    try:
                        members = list(t.members) if t.members else []
                        member_ids = [m.id for m in members if m and hasattr(m, 'id')]
                    except Exception:
                        member_ids = []

                    # Проверяем также через team_id пользователя
                    if current_user.id not in member_ids and (not current_user.team_id or current_user.team_id != t.id):
                        filtered_teams.append(t)
                except Exception as e:
                    # Пропускаем команду если не можем проверить
                    continue

            teams = filtered_teams
            recommendations_list = []

            for team in teams:
                try:
                    score, reasons = calculate_team_compatibility(
                        user=current_user,
                        team=team,
                        preferred_roles=rec_request.preferred_roles,
                        preferred_skills=rec_request.preferred_skills
                    )

                    # Добавить если оценка выше минимума
                    if score >= rec_request.min_score:
                        # Создаем TeamResponse вручную чтобы избежать проблем с вложенными объектами
                        team_response = TeamListResponse(
                            id=team.id,
                            name=team.name,
                            hackathon_id=team.hackathon_id,
                            captain_id=team.captain_id,
                            is_looking=team.is_looking if hasattr(team, 'is_looking') else True
                        )
                        recommendations_list.append(EnhancedRecommendation(
                            recommended_team=team_response,
                            recommended_user=None,
                            compatibility_score=score,
                            match_reasons=reasons
                        ))
                except Exception as e:
                    # Пропускаем команду если возникла ошибка при расчете
                    continue

            # Сортировать и ограничить результаты
            recommendations_list.sort(key=lambda x: x.compatibility_score, reverse=True)
            recommendations_list = recommendations_list[:rec_request.max_results]

            return RecommendationResponse(
                recommendations=recommendations_list,
                total_found=len(recommendations_list)
            )

        elif rec_request.for_what == "user":
            # ===== РЕКОМЕНДАЦИИ ПОЛЬЗОВАТЕЛЕЙ КОМАНДЕ =====

            # Найти команду текущего пользователя (где он капитан)
            user_team = db.query(Team).filter(Team.captain_id == current_user.id).first()

            if not user_team:
                raise HTTPException(
                    status_code=400,
                    detail="User must be a team captain to get user recommendations"
                )

            # Получить пользователей для рекомендации
            # Исключаем пользователей, которые уже в команде капитана
            try:
                members = list(user_team.members) if user_team.members else []
                member_ids = [m.id for m in members if m and hasattr(m, 'id')]
            except Exception:
                member_ids = []

            filter_conditions = [
                User.id.notin_(exclude_user_ids) if exclude_user_ids else True,
                User.ready_to_work == True,
                User.id != current_user.id,
                User.id.notin_(member_ids)  # Исключаем уже состоящих в команде
            ]

            users_query = db.query(User).filter(and_(*filter_conditions))

            users = users_query.all()
            recommendations_list = []

            for user in users:
                try:
                    score, reasons = calculate_user_compatibility(
                        candidate=user,
                        preferred_roles=rec_request.preferred_roles,
                        preferred_skills=rec_request.preferred_skills
                    )

                    # Добавить если оценка выше минимума
                    if score >= rec_request.min_score:
                        # Создаем UserResponse вручную чтобы избежать проблем с lazy loading
                        from app.schemas import SkillResponse
                        user_skills_data = [SkillResponse(id=s.id, name=s.name) for s in (user.skills or [])]

                        user_response = UserResponse(
                            id=user.id,
                            tg_id=user.tg_id,
                            username=user.username,
                            full_name=user.full_name,
                            bio=user.bio or "",
                            main_role=user.main_role.value if user.main_role else None,
                            ready_to_work=user.ready_to_work,
                            team_id=user.team_id,
                            created_at=user.created_at,
                            skills=user_skills_data,
                            achievements=[]
                        )

                        recommendations_list.append(EnhancedRecommendation(
                            recommended_user=user_response,
                            recommended_team=None,
                            compatibility_score=score,
                            match_reasons=reasons
                        ))
                except Exception as e:
                    # Пропускаем пользователя если возникла ошибка
                    continue

            # Сортировать и ограничить результаты
            recommendations_list.sort(key=lambda x: x.compatibility_score, reverse=True)
            recommendations_list = recommendations_list[:rec_request.max_results]

            return RecommendationResponse(
                recommendations=recommendations_list,
                total_found=len(recommendations_list)
            )

        else:
            raise HTTPException(
                status_code=400,
                detail="for_what must be 'team' or 'user'"
            )
    except HTTPException as he:
        raise he
    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        print(f"ERROR in recommendations: {error_details}")  # Логирование для отладки
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}. Type: {type(e).__name__}"
        )


@router.post("/teams/{team_id}", response_model=RecommendationResponse)
async def get_team_recommendations(
    # http_request: StarletteRequest, # Убираем
    team_id: int,
    rec_request: RecommendationRequest,
    current_user: User = Depends(get_current_user), # Добавляем
    db: Session = Depends(get_db)
):
    """
    Получить рекомендации пользователей для конкретной команды
    с детальной оценкой совместимости

    Требуется быть капитаном команды
    """
    # current_user = get_current_user_from_request(http_request) # Убираем
    # current_user уже получен из JWT

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

    # Собрать членов команды для исключения
    team_member_ids = {member.id for member in team.members}

    exclude_user_ids = list(team_member_ids)
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
    recommendations_list = []

    for user in users:
        score, reasons = calculate_user_compatibility(
            candidate=user,
            preferred_roles=rec_request.preferred_roles,
            preferred_skills=rec_request.preferred_skills
        )

        # Добавить если оценка выше минимума
        if score >= rec_request.min_score:
            recommendations_list.append(EnhancedRecommendation(
                recommended_user=UserResponse.from_orm(user),
                recommended_team=None,
                compatibility_score=score,
                match_reasons=reasons
            ))

    # Сортировать и ограничить результаты
    recommendations_list.sort(key=lambda x: x.compatibility_score, reverse=True)
    recommendations_list = recommendations_list[:rec_request.max_results]

    return RecommendationResponse(
        recommendations=recommendations_list,
        total_found=len(recommendations_list)
    )


@router.get("/stats", response_model=dict)
async def get_recommendation_stats(
    # http_request: StarletteRequest, # Убираем
    current_user: User = Depends(get_current_user), # Добавляем
    db: Session = Depends(get_db)
):
    """
    Получить статистику по рекомендациям
    """
    # current_user = get_current_user_from_request(http_request) # Убираем
    # current_user уже получен из JWT

    # Получить команду пользователя (если он капитан)
    user_team = db.query(Team).filter(Team.captain_id == current_user.id).first()

    total_users = db.query(func.count(User.id)).scalar()
    total_teams = db.query(func.count(Team.id)).scalar()
    active_users = db.query(func.count(User.id)).filter(User.ready_to_work == True).scalar()

    stats = {
        "total_users": total_users,
        "total_teams": total_teams,
        "active_users": active_users,
        "user_team": {
            "id": user_team.id,
            "name": user_team.name,
            "member_count": len(user_team.members)
        } if user_team else None
    }

    return stats