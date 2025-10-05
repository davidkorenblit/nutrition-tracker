from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.plate import Plate
from app.models.meal import Meal
from app.models.user import User
from app.schemas.plate import PlateCreate, PlateResponse
from app.services.plate_service import create_free_plate
from app.utils.dependencies import get_current_user
from typing import List

router = APIRouter(
    prefix="/api/v1/plates",
    tags=["plates"]
)

@router.post("/", response_model=PlateResponse)
def create_plate(
    plate_data: PlateCreate, 
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # וודא שהארוחה שייכת למשתמש
    meal = db.query(Meal).filter(
        Meal.id == plate_data.meal_id,
        Meal.user_id == current_user.id
    ).first()
    
    if not meal:
        raise HTTPException(
            status_code=404,
            detail="Meal not found"
        )
    
    # השתמש ב-service ליצירת הצלחת
    plate = create_free_plate(
        meal_id=plate_data.meal_id,
        vegetables=plate_data.vegetables_percent,
        protein=plate_data.protein_percent,
        carbs=plate_data.carbs_percent,
        db=db
    )
    
    return plate


@router.get("/{meal_id}", response_model=List[PlateResponse])
def get_plates_by_meal(
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
    
    plates = db.query(Plate).filter(Plate.meal_id == meal_id).all()
    
    if not plates:
        raise HTTPException(
            status_code=404, 
            detail=f"No plates found for meal {meal_id}"
        )
    
    return plates