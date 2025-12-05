from pydantic import BaseModel
from typing import List, Optional
from .hackathon import HackathonRead

class CalendarResponse(BaseModel):
    """Ответ для календаря хакатонов"""
    upcoming: List[HackathonRead]
    history: List[HackathonRead]


class NotificationResponse(BaseModel):
    """Ответ с уведомлением о ближайшем хакатоне"""
    has_notification: bool
    message: Optional[str] = None
    hackathon_id: Optional[int] = None
