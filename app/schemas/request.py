from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from .user import UserRead
from enum import Enum

class RequestStatus(str, Enum):
    pending = "pending"
    accepted = "accepted"
    rejected = "rejected"

class JoinRequestCreate(BaseModel):
    team_id: int

class JoinRequestResponse(BaseModel):
    id: int
    user_id: int
    team_id: int
    status: RequestStatus
    created_at: datetime
    user: Optional[UserRead] = None

    class Config:
        from_attributes = True
