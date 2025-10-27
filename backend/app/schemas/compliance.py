from pydantic import BaseModel, field_validator
from datetime import datetime
from typing import Optional, Dict, List, Any


class WaterIntakeDetails(BaseModel):
    """פירוט בדיקת שתייה"""
    daily_avg_ml: float
    goal_ml: int
    days_met_goal: int
    total_days: int
    percentage_days_met: float


class NewFoodItem(BaseModel):
    """פריט מזון חדש"""
    food_name: str
    difficulty_level: int
    date: Optional [str] = None
    notes: Optional[str] = None


class NewFoodsDetails(BaseModel):
    """פירוט מזונות חדשים"""
    total_new_foods: int
    foods: List[NewFoodItem]


class RecommendationsMatchDetails(BaseModel):
    """פירוט התאמה להמלצות (מה-LLM)"""
    analysis: str
    matched_items: List[str]
    unmatched_items: List[str]
    recommendations_followed: int
    total_recommendations: int


class HealthyPlatesDetails(BaseModel):
    """פירוט יחס צלחות בריאות - ארוחות שדווחו"""
    total_reported_meals: int  # שונה מ-total_plates - ארוחות עם 2 צלחות
    healthy_meals: int  # שונה מ-healthy_plates - ארוחות שהצלחת החופשית שלהן זהה לבריאה
    ratio_percentage: float


class ComplianceCheckResponse(BaseModel):
    """תוצאת בדיקת עמידה מלאה"""
    id: int
    user_id: int
    check_date: datetime
    period_start: str
    period_end: str
    
    water_intake_score: Optional[float] = None
    water_intake_details: Optional[WaterIntakeDetails] = None
    
    new_foods_score: Optional[float] = None
    new_foods_details: Optional[NewFoodsDetails] = None
    
    recommendations_match_score: Optional[float] = None
    recommendations_match_details: Optional[RecommendationsMatchDetails] = None
    
    healthy_plates_ratio_score: Optional[float] = None
    healthy_plates_details: Optional[HealthyPlatesDetails] = None
    
    overall_score: Optional[float] = None
    
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class ComplianceCheckCreate(BaseModel):
    """Schema ליצירת בדיקת עמידה חדשה (טריגר ידני)"""
    period_start: str  # "2025-10-01"
    period_end: str    # "2025-10-15"


class ComplianceScoreSummary(BaseModel):
    """סיכום ציונים בלבד"""
    period_start: str
    period_end: str
    water_intake_score: Optional[float] = None
    new_foods_score: Optional[float] = None
    recommendations_match_score: Optional[float] = None
    healthy_plates_ratio_score: Optional[float] = None
    overall_score: Optional[float] = None