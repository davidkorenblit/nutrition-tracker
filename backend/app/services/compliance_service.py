from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.compliance import Compliance
from app.models.nutritionist_recommendations import NutritionistRecommendations
from app.models.weekly_notes import WeeklyNotes
from app.models.water_log import WaterLog
from app.models.meal import Meal
from app.models.plate import Plate
from app.models.user import User
from fastapi import HTTPException
from typing import Dict, List, Optional
from datetime import datetime, timedelta
import google.generativeai as genai
import json
import os


def check_water_intake(
    user_id: int,
    period_start: str,
    period_end: str,
    db: Session
) -> tuple[float, Dict]:
    """
    בדיקה 1: כמות שתייה יומית
    
    Returns:
        tuple: (score 0-100, details dict)
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return 0.0, {}
    
    start_date = datetime.strptime(period_start, "%Y-%m-%d")
    end_date = datetime.strptime(period_end, "%Y-%m-%d")
    
    # שלוף את כל רישומי המים בתקופה
    water_logs = db.query(WaterLog).filter(
        WaterLog.user_id == user_id,
        WaterLog.logged_at >= start_date,
        WaterLog.logged_at <= end_date
    ).all()
    
    if not water_logs:
        return 0.0, {
            "daily_avg_ml": 0,
            "goal_ml": user.daily_water_goal_ml,
            "days_met_goal": 0,
            "total_days": (end_date - start_date).days + 1,
            "percentage_days_met": 0.0
        }
    
    # חישוב לפי יום
    daily_intake = {}
    for log in water_logs:
        date_key = log.logged_at.date()
        if date_key not in daily_intake:
            daily_intake[date_key] = 0
        daily_intake[date_key] += log.amount_ml
    
    total_days = (end_date - start_date).days + 1
    days_met_goal = sum(1 for daily_ml in daily_intake.values() if daily_ml >= user.daily_water_goal_ml)
    daily_avg = sum(daily_intake.values()) / len(daily_intake) if daily_intake else 0
    percentage_days_met = (days_met_goal / total_days) * 100 if total_days > 0 else 0
    
    # ציון: אחוז הימים שעמדו ביעד
    score = percentage_days_met
    
    details = {
        "daily_avg_ml": round(daily_avg, 2),
        "goal_ml": user.daily_water_goal_ml,
        "days_met_goal": days_met_goal,
        "total_days": total_days,
        "percentage_days_met": round(percentage_days_met, 2)
    }
    
    return score, details


def check_new_foods(
    user_id: int,
    period_start: str,
    period_end: str,
    db: Session
) -> tuple[float, Dict]:
    """
    בדיקה 2: מזונות חדשים שנוסו
    
    Returns:
        tuple: (score 0-100, details dict)
    """
    start_date = datetime.strptime(period_start, "%Y-%m-%d")
    end_date = datetime.strptime(period_end, "%Y-%m-%d")
    
    # שלוף את כל ה-weekly notes בתקופה
    weekly_notes = db.query(WeeklyNotes).filter(
        WeeklyNotes.user_id == user_id,
        WeeklyNotes.week_start_date >= period_start,
        WeeklyNotes.week_start_date <= period_end
    ).all()
    
    all_new_foods = []
    for note in weekly_notes:
        if note.new_foods:
            all_new_foods.extend(note.new_foods)
    
    if not all_new_foods:
        return 0.0, {
            "total_new_foods": 0,
            "foods": []
        }
    
    # ציון: 10 נקודות לכל מזון חדש (עד 100)
    score = min(len(all_new_foods) * 10, 100.0)
    
    details = {
        "total_new_foods": len(all_new_foods),
        "foods": all_new_foods
    }
    
    return score, details


def check_recommendations_match_llm(
    user_id: int,
    period_start: str,
    period_end: str,
    db: Session
) -> tuple[float, Dict]:
    """
    בדיקה 3: התאמה להמלצות תזונאיות באמצעות LLM
    
    Returns:
        tuple: (score 0-100, details dict)
    """
    # שלוף את ההמלצות האחרונות
    latest_rec = db.query(NutritionistRecommendations).filter(
        NutritionistRecommendations.user_id == user_id
    ).order_by(NutritionistRecommendations.visit_date.desc()).first()
    
    if not latest_rec or not latest_rec.recommendations:
        return 0.0, {
            "analysis": "No recommendations found",
            "matched_items": [],
            "unmatched_items": [],
            "recommendations_followed": 0,
            "total_recommendations": 0
        }
    
    # שלוף מזונות חדשים שנוסו בתקופה
    weekly_notes = db.query(WeeklyNotes).filter(
        WeeklyNotes.user_id == user_id,
        WeeklyNotes.week_start_date >= period_start,
        WeeklyNotes.week_start_date <= period_end
    ).all()
    
    all_new_foods = []
    for note in weekly_notes:
        if note.new_foods:
            all_new_foods.extend([f["food_name"] for f in note.new_foods])
    
    if not all_new_foods:
        return 50.0, {
            "analysis": "No new foods tried during this period",
            "matched_items": [],
            "unmatched_items": [rec["text"] for rec in latest_rec.recommendations],
            "recommendations_followed": 0,
            "total_recommendations": len(latest_rec.recommendations)
        }
    
   # להחליף את זה לגימיני כמו שמופיע כבר בחלק שארחאי על ההמלצות
    # קריאה ל-LLM לניתוח
    try:
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise Exception("GEMINI_API_KEY not configured")
        
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel('gemini-flash-latest')
        
        prompt = f"""
You are a nutrition compliance analyzer. Compare the new foods the user tried against their nutritionist's recommendations.

Nutritionist Recommendations:
{[rec['text'] for rec in latest_rec.recommendations]}

New Foods User Tried:
{all_new_foods}

Analyze:
1. Which recommendations were followed (list specific items)
2. Which recommendations were not followed
3. Overall compliance score (0-100)

Return your response in this exact JSON format, without any markdown or extra text:
{{
    "analysis": "brief explanation",
    "matched_items": ["item1", "item2"],
    "unmatched_items": ["item3", "item4"],
    "score": 75
}}
"""
        
        response = model.generate_content(prompt)
        response_text = response.text.strip()
        
        # ניקוי markdown אם יש
        import re
        response_text = re.sub(r'```json\s*', '', response_text)
        response_text = re.sub(r'```\s*', '', response_text)
        
        # חילוץ JSON מהתשובה
        start_idx = response_text.find('{')
        end_idx = response_text.rfind('}') + 1
        json_str = response_text[start_idx:end_idx]
        result = json.loads(json_str)
        
        score = result.get("score", 50.0)
        details = {
            "analysis": result.get("analysis", "Analysis completed"),
            "matched_items": result.get("matched_items", []),
            "unmatched_items": result.get("unmatched_items", []),
            "recommendations_followed": len(result.get("matched_items", [])),
            "total_recommendations": len(latest_rec.recommendations)
        }
        
        return score, details
        
    except Exception as e:
        print(f"LLM Error: {e}")
        # במקרה של שגיאה, החזר ציון ברירת מחדל
        return 50.0, {
            "analysis": f"Error in LLM analysis: {str(e)}",
            "matched_items": [],
            "unmatched_items": [rec["text"] for rec in latest_rec.recommendations],
            "recommendations_followed": 0,
            "total_recommendations": len(latest_rec.recommendations)
        }


def check_healthy_plates_ratio(
    user_id: int,
    period_start: str,
    period_end: str,
    db: Session
) -> tuple[float, Dict]:
    """
    בדיקה 4: יחס צלחות בריאות
    
    בודק את הפער הממוצע בין הצלחות החופשיות לצלחת הבריאה (50/30/20).
    מחשב ציון על בסיס מרחק ממוצע מהיעד.
    
    Returns:
        tuple: (score 0-100, details dict)
    """
    start_date = datetime.strptime(period_start, "%Y-%m-%d")
    end_date = datetime.strptime(period_end, "%Y-%m-%d")
    
    # שלוף את כל הארוחות בתקופה
    meals = db.query(Meal).filter(
        Meal.user_id == user_id,
        Meal.date >= period_start,
        Meal.date <= period_end
    ).all()
    
    if not meals:
        return 0.0, {
            "total_reported_meals": 0,
            "healthy_meals": 0.0,
            "ratio_percentage": 0.0
        }
    
    # רשימת ציוני ארוחות
    meal_scores = []
    
    for meal in meals:
        # שלוף את הצלחות של הארוחה
        plates = db.query(Plate).filter(Plate.meal_id == meal.id).all()
        
        # רק ארוחות עם בדיוק 2 צלחות (healthy + free) נחשבות כ"מדווחות"
        if len(plates) != 2:
            continue
        
        # מצא את הצלחת החופשית (plate_type == "free")
        free_plate = next((p for p in plates if p.plate_type == "free"), None)
        
        if free_plate:
            # חישוב הפער מהצלחת הבריאה (50/30/20)
            vegetables_gap = abs(50 - free_plate.vegetables_percent)
            protein_gap = abs(30 - free_plate.protein_percent)
            carbs_gap = abs(20 - free_plate.carbs_percent)
            
            # ממוצע הפערים
            avg_gap = (vegetables_gap + protein_gap + carbs_gap) / 3
            
            # ציון לארוחה זו: 100 - הפער הממוצע
            # (ככל שהפער קטן יותר, הציון גבוה יותר)
            meal_score = max(0, 100 - avg_gap)
            meal_scores.append(meal_score)
    
    # אם אין ארוחות מדווחות, החזר 0
    if len(meal_scores) == 0:
        return 0.0, {
            "total_reported_meals": 0,
            "healthy_meals": 0.0,
            "ratio_percentage": 0.0
        }
    
    # חישוב ממוצע הציונים של כל הארוחות
    average_score = sum(meal_scores) / len(meal_scores)
    
    details = {
        "total_reported_meals": len(meal_scores),
        "healthy_meals": round(average_score, 2),  # עכשיו זה ממוצע ציונים ולא ספירה
        "ratio_percentage": round(average_score, 2)
    }
    
    return round(average_score, 2), details


def run_compliance_check(
    user_id: int,
    period_start: str,
    period_end: str,
    db: Session
) -> Compliance:
    """
    הרצת בדיקת עמידה מלאה - כל 4 הבדיקות
    
    Returns:
        Compliance: רשומת בדיקה חדשה
    """
    # הרצת 4 הבדיקות
    water_score, water_details = check_water_intake(user_id, period_start, period_end, db)
    foods_score, foods_details = check_new_foods(user_id, period_start, period_end, db)
    rec_score, rec_details = check_recommendations_match_llm(user_id, period_start, period_end, db)
    plates_score, plates_details = check_healthy_plates_ratio(user_id, period_start, period_end, db)
    
    # חישוב ציון כולל (ממוצע)
    scores = [water_score, foods_score, rec_score, plates_score]
    overall_score = sum(scores) / len(scores)
    
    # יצירת רשומה חדשה
    compliance = Compliance(
        user_id=user_id,
        period_start=period_start,
        period_end=period_end,
        water_intake_score=water_score,
        water_intake_details=water_details,
        new_foods_score=foods_score,
        new_foods_details=foods_details,
        recommendations_match_score=rec_score,
        recommendations_match_details=rec_details,
        healthy_plates_ratio_score=plates_score,
        healthy_plates_details=plates_details,
        overall_score=round(overall_score, 2)
    )
    
    db.add(compliance)
    db.commit()
    db.refresh(compliance)
    
    return compliance


def get_latest_compliance_check(user_id: int, db: Session) -> Optional[Compliance]:
    """
    שליפת בדיקת העמידה האחרונה של המשתמש
    """
    return db.query(Compliance).filter(
        Compliance.user_id == user_id
    ).order_by(Compliance.check_date.desc()).first()


def get_compliance_history(
    user_id: int,
    limit: int,
    db: Session
) -> List[Compliance]:
    """
    שליפת היסטוריית בדיקות עמידה
    """
    return db.query(Compliance).filter(
        Compliance.user_id == user_id
    ).order_by(Compliance.check_date.desc()).limit(limit).all()