from pydantic import BaseModel, EmailStr
from datetime import datetime

class UserListResponse(BaseModel):
    id: int
    username: str
    email: EmailStr
    full_name: str
    created_at: datetime

    class Config:
        from_attributes = True
