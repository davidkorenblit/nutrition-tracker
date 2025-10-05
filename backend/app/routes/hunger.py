from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.hunger_log import HungerLog
from app.models.meal import Meal
from app.models.user import User
from app.schemas.hunger_log import HungerLogCreate, HungerLogResponse
from app.services.hunger_service import create_hunger_log
from app.utils.dependencies import get_current_user
from typing import List

router = APIRouter(
    prefix="/api/v1/hunger-logs",
    tags=["hunger-logs"]
)

@router.post("/", response_model=HungerLogResponse)
def create_log(
    log_data: HungerLogCreate, 
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # וודא שהארוחה שייכת למשתמש
    meal = db.query(Meal).filter(
        Meal.id == log_data.meal_id,
        Meal.user_id == current_user.id
    ).first()
    
    if not meal:
        raise HTTPException(
            status_code=404,
            detail="Meal not found"
        )
    
    hunger_log = create_hunger_log(
        meal_id=log_data.meal_id,
        log_type=log_data.log_type,
        hunger_level=log_data.hunger_level,
        db=db
    )
    
    return hunger_log


@router.get("/{meal_id}", response_model=List[HungerLogResponse])
def get_hunger_logs_by_meal(
    meal_id: int, 
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # וודא שהארוחה שייכת למשתמש
    meal = db.query(Meal).filter(
        Meal.id == meal_id,
        Meal.user_id == current_user.id
    ).first()
    
    if not meal:
        raise HTTPException(
            status_code=404,
            detail="Meal not found"
        )
    
    logs = db.query(HungerLog).filter(HungerLog.meal_id == meal_id).all()
    
    if not logs:
        raise HTTPException(
            status_code=404,
            detail=f"No hunger logs found for meal {meal_id}"
        )
    
    return logs