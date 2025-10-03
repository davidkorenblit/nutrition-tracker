from sqlalchemy.orm import Session
from app.models.meal import Meal
from app.services.plate_service import create_healthy_plate
from datetime import datetime

def ensure_daily_meals(date: str, db: Session):
    """
    וודא שקיימות 3 ארוחות עבור תאריך מסוים.
    אם לא - צור אותן אוטומטית + צלחת בריאה לכל אחת.
    
    Args:
        date: תאריך (YYYY-MM-DD)
        db: database session
    
    Returns:
        bool: True אם הצליח
    """
    meal_types = ["breakfast", "lunch", "dinner"]
    
    for meal_type in meal_types:
        # בדוק אם הארוחה כבר קיימת
        existing_meal = db.query(Meal).filter(
            Meal.date == date,
            Meal.meal_type == meal_type
        ).first()
        
        # אם לא קיימת - צור אותה + HP
        if not existing_meal:
            # 1. צור ארוחה
            new_meal = Meal(
                meal_type=meal_type,
                date=date
            )
            db.add(new_meal)
            db.commit()
            db.refresh(new_meal)
            
            # 2. צור צלחת בריאה אוטומטית (50/30/20)
            create_healthy_plate(new_meal.id, db)
    
    return True