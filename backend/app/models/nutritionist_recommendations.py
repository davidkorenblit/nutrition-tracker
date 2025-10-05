from sqlalchemy import Column, Integer, String, JSON, DateTime
from datetime import datetime
from app.database import Base

class NutritionistRecommendations(Base):
    """
    טבלה לאחסון קבצי Word עם המלצות תזונאיות.
    כל ביקור = רשומה אחת עם ההמלצות שחולצו מהקובץ.
    """
    __tablename__ = "nutritionist_recommendations"
    
    id = Column(Integer, primary_key=True, index=True)
    visit_date = Column(String, nullable=False)  # פורמט: YYYY-MM-DD
    file_path = Column(String, nullable=False)   # נתיב לקובץ Word
    raw_text = Column(String, nullable=True)     # טקסט מלא מהקובץ
    recommendations = Column(JSON, nullable=False)  # רשימת המלצות: [{id, text, category, tracked, target_value, notes}, ...]
    created_at = Column(DateTime, default=datetime.utcnow)