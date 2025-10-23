from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, JSON
from datetime import datetime
from app.database import Base

class Compliance(Base):
    """
    טבלה לאחסון תוצאות בדיקות עמידה אוטומטיות.
    כל רשומה = בדיקה שבוצעה בתקופה מסוימת עבור משתמש.
    """
    __tablename__ = "compliance"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    check_date = Column(DateTime, default=datetime.utcnow, nullable=False)  # תאריך הבדיקה
    period_start = Column(String, nullable=False)  # "2025-10-01"
    period_end = Column(String, nullable=False)    # "2025-10-15"
    
    # 4 בדיקות - כל אחת עם ציון ופירוט
    water_intake_score = Column(Float, nullable=True)  # 0-100
    water_intake_details = Column(JSON, nullable=True)  # {daily_avg_ml, goal_ml, days_met_goal, etc}
    
    new_foods_score = Column(Float, nullable=True)  # 0-100
    new_foods_details = Column(JSON, nullable=True)  # [{food_name, difficulty, date}, ...]
    
    recommendations_match_score = Column(Float, nullable=True)  # 0-100 (from LLM)
    recommendations_match_details = Column(JSON, nullable=True)  # {analysis, matched_items, unmatched_items}
    
    healthy_plates_ratio_score = Column(Float, nullable=True)  # 0-100
    healthy_plates_details = Column(JSON, nullable=True)  # {total_plates, healthy_plates, ratio}
    
    # ציון כולל
    overall_score = Column(Float, nullable=True)  # ממוצע 4 הבדיקות
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)