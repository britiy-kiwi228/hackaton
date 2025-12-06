from pydantic import BaseModel
from typing import Optional

class RequestUpdate(BaseModel):
    status: Optional[str] = None
