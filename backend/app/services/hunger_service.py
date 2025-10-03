from sqlalchemy.orm import Session
from app.models.hunger_log import HungerLog
from fastapi import HTTPException
from datetime import datetime

def create_hunger_log(
    meal_id: int,
    log_type: str,
    hunger_level: int,
    db: Session
) -> HungerLog:
    """
    יוצר רישום רעב חדש.
    
    Args:
        meal_id: ID של הארוחה
        log_type: סוג הרישום ("before" / "during" / "after")
        hunger_level: רמת רעב (1-10)
        db: database session
    
    Returns:
        HungerLog: רישום הרעב שנוצר
    
    Raises:
        HTTPException: אם hunger_level לא בטווח 1-10
    """
    # Validation: רמת רעב חייבת להיות 1-10
    if not validate_hunger_level(hunger_level):
        raise HTTPException(
            status_code=400,
            detail=f"Hunger level must be between 1 and 10, got {hunger_level}"
        )
    
    # Validation: log_type חייב להיות אחד מהערכים המותרים
    if log_type not in ["before", "during", "after"]:
        raise HTTPException(
            status_code=400,
            detail=f"Log type must be 'before', 'during', or 'after', got '{log_type}'"
        )
    
    hunger_log = HungerLog(
        meal_id=meal_id,
        log_type=log_type,
        hunger_level=hunger_level,
        timestamp=datetime.utcnow()
    )
    
    db.add(hunger_log)
    db.commit()
    db.refresh(hunger_log)
    
    return hunger_log


def validate_hunger_level(level: int) -> bool:
    """
    בודק שרמת הרעב בטווח תקין (1-10).
    
    Args:
        level: רמת הרעב
    
    Returns:
        bool: True אם בטווח, False אחרת
    """
    return 1 <= level <= 10


def create_multiple_hunger_logs(
    meal_id: int,
    before: int,
    during: int,
    after: int,
    db: Session
) -> dict:
    """
    יוצר 3 רישומי רעב בבת אחת (before/during/after).
    פונקציה עזר ל-complete meal endpoint.
    
    Args:
        meal_id: ID של הארוחה
        before: רעב לפני (1-10)
        during: רעב במהלך (1-10)
        after: רעב אחרי (1-10)
        db: database session
    
    Returns:
        dict: {
            "before": HungerLog,
            "during": HungerLog,
            "after": HungerLog
        }
    """
    logs = {
        "before": create_hunger_log(meal_id, "before", before, db),
        "during": create_hunger_log(meal_id, "during", during, db),
        "after": create_hunger_log(meal_id, "after", after, db)
    }
    
    return logs