from fastapi import HTTPException
from datetime import datetime


def validate_meal_type(meal_type: str) -> bool:
    """בדיקת meal_type תקין"""
    allowed = ["breakfast", "lunch", "dinner"]
    if meal_type not in allowed:
        raise HTTPException(
            status_code=400,
            detail=f"meal_type must be one of: {', '.join(allowed)}"
        )
    return True


def validate_hunger_level(level: int) -> bool:
    """בדיקת hunger_level תקין (1-10)"""
    if not 1 <= level <= 10:
        raise HTTPException(
            status_code=400,
            detail=f"hunger_level must be between 1 and 10, got {level}"
        )
    return True


def validate_plate_percentages(veg: int, protein: int, carbs: int) -> bool:
    """בדיקת סכום אחוזים = 100"""
    total = veg + protein + carbs
    if total != 100:
        raise HTTPException(
            status_code=400,
            detail=f"Plate percentages must sum to 100, got {total}"
        )
    return True


def validate_difficulty_level(level: int) -> bool:
    """בדיקת difficulty_level תקין (1-10)"""
    if not 1 <= level <= 10:
        raise HTTPException(
            status_code=400,
            detail=f"difficulty_level must be between 1 and 10, got {level}"
        )
    return True


def validate_date_format(date_str: str) -> bool:
    """בדיקת פורמט תאריך YYYY-MM-DD - לשימוש ב-routes/services"""
    try:
        datetime.strptime(date_str, "%Y-%m-%d")
        return True
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid date format. Use YYYY-MM-DD, got: {date_str}"
        )


def validate_date_format_pydantic(date_str: str) -> str:
    """בדיקת פורמט תאריך YYYY-MM-DD - לשימוש ב-Pydantic field_validator"""
    try:
        datetime.strptime(date_str, "%Y-%m-%d")
        return date_str
    except ValueError:
        raise ValueError(f"Invalid date format. Use YYYY-MM-DD, got: {date_str}")