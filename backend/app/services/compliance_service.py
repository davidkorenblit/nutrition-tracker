from sqlalchemy.orm import Session
from app.models.compliance import Compliance
from app.models.nutritionist_recommendations import NutritionistRecommendations
from app.models.weekly_notes import WeeklyNotes
from fastapi import HTTPException
from typing import Dict, List


def calculate_compliance_rate(
    recommendation_id: int,
    recommendation_item_id: int,
    db: Session
) -> float:
    """
    חישוב אחוז עמידה בהמלצה ספציפית.
    
    Args:
        recommendation_id: ID של המלצות הביקור
        recommendation_item_id: ID של ההמלצה הספציפית
        db: database session
    
    Returns:
        float: אחוז עמידה (0-100)
    """
    compliance = db.query(Compliance).filter(
        Compliance.recommendation_id == recommendation_id,
        Compliance.recommendation_item_id == recommendation_item_id
    ).first()
    
    return compliance.completion_rate if compliance else 0.0


def generate_compliance_report(
    recommendation_id: int,
    visit_period: str,
    db: Session
) -> Dict:
    """
    יצירת דוח מסכם של עמידה בהמלצות לתקופה מסוימת.
    
    Args:
        recommendation_id: ID של המלצות הביקור
        visit_period: תקופת הביקור (למשל: "2025-10-30 to 2025-11-13")
        db: database session
    
    Returns:
        Dict: דוח מסכם
    """
    # שלוף את ההמלצות
    rec = db.query(NutritionistRecommendations).filter(
        NutritionistRecommendations.id == recommendation_id
    ).first()
    
    if not rec:
        raise HTTPException(
            status_code=404,
            detail=f"Recommendations with id {recommendation_id} not found"
        )
    
    # שלוף את כל דיווחי ה-compliance לתקופה
    compliances = db.query(Compliance).filter(
        Compliance.recommendation_id == recommendation_id,
        Compliance.visit_period == visit_period
    ).all()
    
    # סטטיסטיקות
    total = len(rec.recommendations)
    completed = len([c for c in compliances if c.status == "completed"])
    in_progress = len([c for c in compliances if c.status == "in_progress"])
    not_started = len([c for c in compliances if c.status == "not_started"])
    abandoned = len([c for c in compliances if c.status == "abandoned"])
    
    # חישוב אחוז כללי
    if compliances:
        overall_rate = sum(c.completion_rate for c in compliances) / len(compliances)
    else:
        overall_rate = 0.0
    
    # בניית רשימת פריטים
    items = []
    for item in rec.recommendations:
        compliance = next(
            (c for c in compliances if c.recommendation_item_id == item["id"]),
            None
        )
        
        if compliance:
            items.append({
                "recommendation_text": item["text"],
                "category": item["category"],
                "status": compliance.status,
                "completion_rate": compliance.completion_rate,
                "notes": compliance.notes
            })
    
    return {
        "visit_period": visit_period,
        "total_recommendations": total,
        "completed": completed,
        "in_progress": in_progress,
        "not_started": not_started,
        "abandoned": abandoned,
        "overall_completion_rate": round(overall_rate, 2),
        "items": items
    }


def check_new_food_in_weekly_notes(
    food_name: str,
    week_start_date: str,
    db: Session
) -> bool:
    """
    בדיקה אם מזון חדש נוסף ל-WeeklyNotes.
    
    Args:
        food_name: שם המזון לחיפוש
        week_start_date: תאריך תחילת השבוע
        db: database session
    
    Returns:
        bool: True אם נמצא, False אחרת
    """
    weekly_note = db.query(WeeklyNotes).filter(
        WeeklyNotes.week_start_date == week_start_date
    ).first()
    
    if not weekly_note:
        return False
    
    # חיפוש במזונות החדשים
    for food in weekly_note.new_foods:
        if food_name.lower() in food.get("food_name", "").lower():
            return True
    
    return False