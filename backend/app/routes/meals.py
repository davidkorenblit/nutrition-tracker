from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload  # 🆕 הוסף joinedload!
from app.database import get_db
from app.models.meal import Meal
from app.models.user import User
from app.schemas.meal import MealCreate, MealResponse, CompleteMealCreate
from app.services.meal_service import ensure_daily_meals
from app.services.plate_service import create_free_plate
from app.services.hunger_service import create_multiple_hunger_logs
from app.utils.dependencies import get_current_user
from typing import List

router = APIRouter(
    prefix="/api/v1/meals",
    tags=["meals"]
)

# קבלת כל הארוחות לתאריך מסוים
@router.get("/", response_model=List[MealResponse])
def get_meals(
    date: str = None, 
    client_id: int = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # 🆕 הוסף joinedload לטעינת relationships!
    query = db.query(Meal).options(
        joinedload(Meal.plates),
        joinedload(Meal.hunger_logs)
    )
    
    target_user_id = client_id if (client_id and current_user.role == "admin") else current_user.id
    
    # אם התאריך סופק - וודא שיש 3 ארוחות
    if date:
        ensure_daily_meals(date, target_user_id, db)
        meals = query.filter(
            Meal.date == date,
            Meal.user_id == target_user_id
        ).all()
    else:
        meals = query.filter(
            Meal.user_id == target_user_id
        ).all()
    
    return meals

# קבלת ארוחה ספציפית
@router.get("/{meal_id}", response_model=MealResponse)
def get_meal(
    meal_id: int, 
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # 🆕 גם כאן - joinedload!
    meal = db.query(Meal).options(
        joinedload(Meal.plates),
        joinedload(Meal.hunger_logs)
    ).filter(
        Meal.id == meal_id,
        Meal.user_id == current_user.id
    ).first()
    
    if not meal:
        raise HTTPException(status_code=404, detail="Meal not found")
    return meal

# עדכון ארוחה
@router.put("/{meal_id}", response_model=MealResponse)
def update_meal(
    meal_id: int, 
    meal: MealCreate, 
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db_meal = db.query(Meal).filter(
        Meal.id == meal_id,
        Meal.user_id == current_user.id
    ).first()
    
    if not db_meal:
        raise HTTPException(status_code=404, detail="Meal not found")
    
    db_meal.meal_type = meal.meal_type
    db_meal.date = meal.date
    db.commit()
    db.refresh(db_meal)
    return db_meal

# מחיקת ארוחה
@router.delete("/{meal_id}")
def delete_meal(
    meal_id: int, 
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    meal = db.query(Meal).filter(
        Meal.id == meal_id,
        Meal.user_id == current_user.id
    ).first()
    
    if not meal:
        raise HTTPException(status_code=404, detail="Meal not found")
    
    db.delete(meal)
    db.commit()
    return {"message": "Meal deleted successfully"}

# מילוי ארוחה מלאה בבקשה אחת
@router.post("/complete", response_model=MealResponse)
def complete_meal(
    meal_data: CompleteMealCreate, 
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # 1. וודא שהארוחה קיימת ושייכת למשתמש
    meal = db.query(Meal).filter(
        Meal.id == meal_data.meal_id,
        Meal.user_id == current_user.id
    ).first()
    
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
    
    if meal_data.photo_url:
        meal.photo_url = meal_data.photo_url
    if meal_data.notes:
        meal.notes = meal_data.notes
        
    meal.is_logged = True
    
    db.commit()

    # 🆕 5. טען מחדש עם relationships לפני החזרה!
    db.refresh(meal)
    meal = db.query(Meal).options(
        joinedload(Meal.plates),
        joinedload(Meal.hunger_logs)
    ).filter(Meal.id == meal.id).first()
    
    return meal