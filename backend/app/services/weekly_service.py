from sqlalchemy.orm import Session
from app.models.weekly_notes import WeeklyNotes
from fastapi import HTTPException
from typing import List, Dict

def create_weekly_notes(
    week_start_date: str,
    new_foods: List[Dict],
    db: Session
) -> WeeklyNotes:
    """
    יוצר רשומה שבועית חדשה.
    
    Args:
        week_start_date: תאריך תחילת השבוע (YYYY-MM-DD)
        new_foods: רשימת מזונות - [{"food_name": str, "difficulty_level": int, "notes": str}, ...]
        db: database session
    
    Returns:
        WeeklyNotes: הרשומה השבועית שנוצרה
    
    Raises:
        HTTPException: אם validation נכשל
    """
    # Validation: רשימה לא ריקה
    if not new_foods or len(new_foods) == 0:
        raise HTTPException(
            status_code=400,
            detail="Must include at least one new food item"
        )
    
    # Validation: difficulty_level לכל מזון
    for food in new_foods:
        difficulty = food.get("difficulty_level")
        if difficulty is not None and not validate_difficulty_level(difficulty):
            raise HTTPException(
                status_code=400,
                detail=f"Difficulty level must be between 1 and 10, got {difficulty} for {food.get('food_name')}"
            )
    
    # בדיקה: האם כבר קיימת רשומה לשבוע הזה
    existing = db.query(WeeklyNotes).filter(
        WeeklyNotes.week_start_date == week_start_date
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=400,
            detail=f"Weekly notes already exist for week starting {week_start_date}"
        )
    
    weekly_notes = WeeklyNotes(
        week_start_date=week_start_date,
        new_foods=new_foods  # SQLAlchemy אוטומטית ממיר ל-JSON
    )
    
    db.add(weekly_notes)
    db.commit()
    db.refresh(weekly_notes)
    
    return weekly_notes


def get_weekly_notes_by_week(week_start_date: str, db: Session) -> WeeklyNotes:
    """
    מחזיר רשומה שבועית לפי תאריך.
    
    Args:
        week_start_date: תאריך תחילת השבוע
        db: database session
    
    Returns:
        WeeklyNotes: הרשומה אם נמצאה
    
    Raises:
        HTTPException: אם לא נמצאה רשומה
    """
    notes = db.query(WeeklyNotes).filter(
        WeeklyNotes.week_start_date == week_start_date
    ).first()
    
    if not notes:
        raise HTTPException(
            status_code=404,
            detail=f"No weekly notes found for week starting {week_start_date}"
        )
    
    return notes


def validate_difficulty_level(level: int) -> bool:
    """
    בודק שרמת הקושי בטווח תקין (1-10).
    
    Args:
        level: רמת הקושי
    
    Returns:
        bool: True אם בטווח, False אחרת
    """
    return 1 <= level <= 10