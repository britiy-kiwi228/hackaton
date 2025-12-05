from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from .user import UserRead
from enum import Enum

class RequestStatus(str, Enum):
    pending = "pending"
    accepted = "accepted"
    rejected = "rejected"

class RequestCreate(BaseModel):
    sender_id: int
    receiver_id: Optional[int] = None
    team_id: Optional[int] = None
    hackathon_id: int
    request_type: str

class JoinRequestCreate(BaseModel):
    team_id: int

class RequestResponse(BaseModel):
    id: int
    sender_id: int
    receiver_id: Optional[int] = None
    team_id: Optional[int] = None
    hackathon_id: int
    request_type: str
    status: RequestStatus
    created_at: datetime

    class Config:
        from_attributes = True

class JoinRequestResponse(BaseModel):
    id: int
    user_id: int
    team_id: int
    status: RequestStatus
    created_at: datetime
    user: Optional[UserRead] = None

    class Config:
        from_attributes = True
