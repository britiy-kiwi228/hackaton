from pydantic import BaseModel

class UserLogin(BaseModel):
    tg_id: int
    username: str
    full_name: str
