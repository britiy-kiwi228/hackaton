from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional, List

class UserResponse(BaseModel):
    id: Optional[int] = int
    username: Optional[str] = str
    email: Optional[EmailStr] = EmailStr
    full_name: Optional[str] = str
    created_at: Optional[datetime] = datetime

    class Config:
        from_attributes = True
