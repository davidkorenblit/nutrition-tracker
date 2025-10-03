from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.meal import Meal
from app.schemas.meal import MealCreate, MealResponse, CompleteMealCreate
from app.services.meal_service import ensure_daily_meals
from app.services.plate_service import create_free_plate
from app.services.hunger_service import create_multiple_hunger_logs
from typing import List

router = APIRouter(
    prefix="/api/v1/meals",
    tags=["meals"]
)

# קבלת כל הארוחות לתאריך מסוים
@router.get("/", response_model=List[MealResponse])
def get_meals(date: str = None, db: Session = Depends(get_db)):
    # אם התאריך סופק - וודא שיש 3 ארוחות
    if date:
        ensure_daily_meals(date, db)
        meals = db.query(Meal).filter(Meal.date == date).all()
    else:
        meals = db.query(Meal).all()
    
    return meals

# קבלת ארוחה ספציפית
@router.get("/{meal_id}", response_model=MealResponse)
def get_meal(meal_id: int, db: Session = Depends(get_db)):
    meal = db.query(Meal).filter(Meal.id == meal_id).first()
    if not meal:
        raise HTTPException(status_code=404, detail="Meal not found")
    return meal

# עדכון ארוחה (משתמש ממלא פרטים)
@router.put("/{meal_id}", response_model=MealResponse)
def update_meal(meal_id: int, meal: MealCreate, db: Session = Depends(get_db)):
    db_meal = db.query(Meal).filter(Meal.id == meal_id).first()
    if not db_meal:
        raise HTTPException(status_code=404, detail="Meal not found")
    
    db_meal.meal_type = meal.meal_type
    db_meal.date = meal.date
    db.commit()
    db.refresh(db_meal)
    return db_meal

# מחיקת ארוחה (לא באמת צריך - הארוחות קבועות)
@router.delete("/{meal_id}")
def delete_meal(meal_id: int, db: Session = Depends(get_db)):
    meal = db.query(Meal).filter(Meal.id == meal_id).first()
    if not meal:
        raise HTTPException(status_code=404, detail="Meal not found")
    
    db.delete(meal)
    db.commit()
    return {"message": "Meal deleted successfully"}

# 🆕 מילוי ארוחה מלאה בבקשה אחת
@router.post("/complete", response_model=MealResponse)
def complete_meal(meal_data: CompleteMealCreate, db: Session = Depends(get_db)):
    """
    מילוי ארוחה מלאה בבקשה אחת.
    כולל: Free Plate + 3 רישומי רעב + תמונה (אופציונלי).
    
    Body:
        - meal_id: ID של הארוחה (מתוך 3 הארוחות היומיות)
        - free_plate_vegetables: אחוז ירקות (0-100)
        - free_plate_protein: אחוז חלבון (0-100)
        - free_plate_carbs: אחוז פחמימות (0-100)
        - hunger_before: רעב לפני (1-10)
        - hunger_during: רעב במהלך (1-10)
        - hunger_after: רעב אחרי (1-10)
        - photo_url: URL של תמונה (אופציונלי)
    
    Returns:
        הארוחה המלאה והמעודכנת
    """
    # 1. וודא שהארוחה קיימת
    meal = db.query(Meal).filter(Meal.id == meal_data.meal_id).first()
    if not meal:
        raise HTTPException(
            status_code=404,
            detail=f"Meal with id {meal_data.meal_id} not found"
        )
    
    # 2. צור Free Plate
    create_free_plate(
        meal_id=meal_data.meal_id,
        vegetables=meal_data.free_plate_vegetables,
        protein=meal_data.free_plate_protein,
        carbs=meal_data.free_plate_carbs,
        db=db
    )
    
    # 3. צור 3 רישומי רעב
    create_multiple_hunger_logs(
        meal_id=meal_data.meal_id,
        before=meal_data.hunger_before,
        during=meal_data.hunger_during,
        after=meal_data.hunger_after,
        db=db
    )
    
    # 4. עדכן photo_url אם סופק
    if meal_data.photo_url:
        meal.photo_url = meal_data.photo_url
        db.commit()
        db.refresh(meal)
    
    return meal