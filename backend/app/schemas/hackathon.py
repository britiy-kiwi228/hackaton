from pydantic import BaseModel, model_validator
from datetime import datetime
from typing import Optional

class HackathonBase(BaseModel):
    title: str
    description: Optional[str] = None
    start_date: datetime
    end_date: datetime
    location: str

class HackathonCreate(HackathonBase):
    @model_validator(mode='after')
    def check_dates(self) -> 'HackathonCreate':
        if self.start_date and self.end_date and self.start_date >= self.end_date:
            raise ValueError("start_date must be before end_date")
        return self

class HackathonUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    location: Optional[str] = None

    @model_validator(mode='after')
    def check_dates(self) -> 'HackathonUpdate':
        if self.start_date and self.end_date and self.start_date >= self.end_date:
            raise ValueError("start_date must be before end_date")
        return self

class HackathonRead(HackathonBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
