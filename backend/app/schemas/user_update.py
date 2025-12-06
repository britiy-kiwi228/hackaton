from pydantic import BaseModel
from typing import Optional, List

class UserUpdate(BaseModel):
    bio: Optional[str] = None
    main_role: Optional[str] = None
    ready_to_work: Optional[bool] = None
    skills: Optional[List[str]] = None
