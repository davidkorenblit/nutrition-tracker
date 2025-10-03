from sqlalchemy.orm import Session
from app.models.plate import Plate
from fastapi import HTTPException

def create_healthy_plate(meal_id: int, db: Session) -> Plate:
    """
    יוצר צלחת בריאה אוטומטית עם אחוזים קבועים.
    נקרא אוטומטית כשיוצרים ארוחה חדשה.
    
    Args:
        meal_id: ID של הארוחה
        db: database session
    
    Returns:
        Plate: הצלחת הבריאה שנוצרה
    """
    healthy_plate = Plate(
        meal_id=meal_id,
        plate_type="healthy",
        vegetables_percent=50,  # קבוע
        protein_percent=30,     # קבוע
        carbs_percent=20        # קבוע
    )
    
    db.add(healthy_plate)
    db.commit()
    db.refresh(healthy_plate)
    
    return healthy_plate


def create_free_plate(
    meal_id: int, 
    vegetables: int, 
    protein: int, 
    carbs: int, 
    db: Session
) -> Plate:
    """
    יוצר צלחת חופשית עם אחוזים שהמשתמש הזין.
    
    Args:
        meal_id: ID של הארוחה
        vegetables: אחוז ירקות (0-100)
        protein: אחוז חלבון (0-100)
        carbs: אחוז פחמימות (0-100)
        db: database session
    
    Returns:
        Plate: הצלחת החופשית שנוצרה
    
    Raises:
        HTTPException: אם הסכום לא 100%
    """
    # Validation: סכום חייב להיות 100%
    total = vegetables + protein + carbs
    if total != 100:
        raise HTTPException(
            status_code=400,
            detail=f"Plate percentages must sum to 100, got {total}"
        )
    
    free_plate = Plate(
        meal_id=meal_id,
        plate_type="free",
        vegetables_percent=vegetables,
        protein_percent=protein,
        carbs_percent=carbs
    )
    
    db.add(free_plate)
    db.commit()
    db.refresh(free_plate)
    
    return free_plate


def validate_plate_percentages(vegetables: int, protein: int, carbs: int) -> bool:
    """
    בודק שסכום האחוזים = 100%
    
    Args:
        vegetables: אחוז ירקות
        protein: אחוז חלבון
        carbs: אחוז פחמימות
    
    Returns:
        bool: True אם הסכום 100%, False אחרת
    """
    return (vegetables + protein + carbs) == 100