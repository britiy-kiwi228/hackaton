from pydantic import BaseModel
from typing import List

class RecommendationRequest(BaseModel):
    user_id: int
    hackathon_id: int
    skills: List[str]

class RecommendationResponse(BaseModel):
    user_id: int
    hackathon_id: int
    recommended_users: List[int]

    class Config:
        from_attributes = True
