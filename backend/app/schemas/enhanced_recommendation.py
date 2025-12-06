from pydantic import BaseModel
from typing import List, Optional
from app.schemas.user_response import UserResponse
from app.schemas.team_list_response import TeamListResponse

class EnhancedRecommendation(BaseModel):
    recommended_user: Optional[UserResponse] = None
    recommended_team: Optional[TeamListResponse] = None
    compatibility_score: float
    match_reasons: List[str]

    class Config:
        from_attributes = True
