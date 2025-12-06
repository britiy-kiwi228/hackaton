from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db

router = APIRouter()

@router.get("/health/live")
async def live():
    return {"status": "live"}

@router.get("/health/ready")
async def ready(db: Session = Depends(get_db)):
    try:
        db.execute("SELECT 1")
        return {"status": "ready"}
    except Exception as e:
        raise HTTPException(status_code=500, detail="Database not ready")
