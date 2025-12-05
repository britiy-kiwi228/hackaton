from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional, List

class UserResponse(BaseModel):
    id: int
    username: str
    email: EmailStr
    full_name: str
    created_at: datetime

    class Config:
        from_attributes = True
