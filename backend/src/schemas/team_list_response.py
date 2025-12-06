from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class TeamListResponse(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    captain_id: int
    created_at: datetime

    class Config:
        from_attributes = True
