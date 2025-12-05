from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class AchievementResponse(BaseModel):
    id: int
    user_id: int
    hackathon_name: str
    place: Optional[int] = None
    team_name: str
    project_link: Optional[str] = None
    year: int
    description: str
    unlocked_at: datetime

    class Config:
        from_attributes = True
