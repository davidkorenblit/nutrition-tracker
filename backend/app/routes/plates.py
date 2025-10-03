from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.plate import PlateCreate, PlateResponse
from app.services.plate_service import create_free_plate
from app.models.plate import Plate
from typing import List

router = APIRouter(
    prefix="/api/v1/plates",
    tags=["plates"]
)

@router.post("/", response_model=PlateResponse)
def create_plate(plate_data: PlateCreate, db: Session = Depends(get_db)):
    """
    יצירת צלחת חדשה (בדרך כלל Free Plate).
    Healthy Plate נוצרת אוטומטית עם הארוחה.
    
    Body:
        - meal_id: ID של הארוחה
        - plate_type: "healthy" או "free"
        - vegetables_percent: אחוז ירקות (0-100)
        - protein_percent: אחוז חלבון (0-100)
        - carbs_percent: אחוז פחמימות (0-100)
    
    Returns:
        הצלחת שנוצרה
    """
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
def get_plates_by_meal(meal_id: int, db: Session = Depends(get_db)):
    """
    קבלת כל הצלחות של ארוחה מסוימת.
    בדרך כלל תחזיר 2 צלחות: Healthy + Free.
    
    Path Parameter:
        - meal_id: ID של הארוחה
    
    Returns:
        רשימת צלחות
    """
    plates = db.query(Plate).filter(Plate.meal_id == meal_id).all()
    
    if not plates:
        raise HTTPException(
            status_code=404, 
            detail=f"No plates found for meal {meal_id}"
        )
    
    return plates