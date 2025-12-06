from pydantic import BaseModel

class SkillResponse(BaseModel):
    id: int
    name: str

    class Config:
        from_attributes = True
