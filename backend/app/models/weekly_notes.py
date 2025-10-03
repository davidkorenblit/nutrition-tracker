from sqlalchemy import Column, Integer, String, JSON, DateTime
from datetime import datetime
from app.database import Base

class WeeklyNotes(Base):
    """
    טבלה לאחסון רשומות שבועיות של מזונות חדשים.
    כל רשומה מכילה רשימה של מזונות שהמשתמש ניסה השבוע.
    """
    __tablename__ = "weekly_notes"
    
    id = Column(Integer, primary_key=True, index=True)
    week_start_date = Column(String, nullable=False)  # פורמט: YYYY-MM-DD
    new_foods = Column(JSON, nullable=False)  # רשימה: [{food_name, difficulty_level, notes}, ...]
    created_at = Column(DateTime, default=datetime.utcnow)