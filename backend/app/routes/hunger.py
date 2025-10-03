from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.hunger_log import HungerLogCreate, HungerLogResponse
from app.services.hunger_service import create_hunger_log
from app.models.hunger_log import HungerLog
from typing import List

router = APIRouter(
    prefix="/api/v1/hunger-logs",
    tags=["hunger-logs"]
)

@router.post("/", response_model=HungerLogResponse)
def create_log(log_data: HungerLogCreate, db: Session = Depends(get_db)):
    """
    יצירת רישום רעב חדש.
    
    Body:
        - meal_id: ID של הארוחה
        - log_type: "before" / "during" / "after"
        - hunger_level: רמת רעב (1-10)
    
    Returns:
        רישום הרעב שנוצר
    """
    hunger_log = create_hunger_log(
        meal_id=log_data.meal_id,
        log_type=log_data.log_type,
        hunger_level=log_data.hunger_level,
        db=db
    )
    
    return hunger_log


@router.get("/{meal_id}", response_model=List[HungerLogResponse])
def get_hunger_logs_by_meal(meal_id: int, db: Session = Depends(get_db)):
    """
    קבלת כל רישומי הרעב של ארוחה מסוימת.
    בדרך כלל תחזיר 3 רישומים: before, during, after.
    
    Path Parameter:
        - meal_id: ID של הארוחה
    
    Returns:
        רשימת רישומי רעב
    """
    logs = db.query(HungerLog).filter(HungerLog.meal_id == meal_id).all()
    
    if not logs:
        raise HTTPException(
            status_code=404,
            detail=f"No hunger logs found for meal {meal_id}"
        )
    
    return logs