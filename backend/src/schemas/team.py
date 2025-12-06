from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class TeamCreate(BaseModel):
    name: str
    description: Optional[str] = None

class TeamUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None

class TeamRead(BaseModel):
    id: int
    name: str
    description: Optional[str]
    captain_id: int
    created_at: datetime

    class Config:
        from_attributes = True
