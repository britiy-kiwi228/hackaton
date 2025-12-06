from pydantic import BaseModel
from typing import Dict, Any

class TelegramAuthRequest(BaseModel):
    """Запрос авторизации через Telegram Login Widget"""
    auth_data: Dict[str, Any]
