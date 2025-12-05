from pydantic import BaseModel, EmailStr, constr
from datetime import datetime
from typing import Optional, List

class UserRegister(BaseModel):
    username: str
    email: EmailStr
    password: str
    full_name: str

class UserRead(BaseModel):
    id: int
    username: str
    email: EmailStr
    full_name: str
    created_at: datetime

    class Config:
        from_attributes = True
