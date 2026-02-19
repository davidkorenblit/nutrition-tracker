from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class WeeklyNotes(Base):
    """
    טבלה לאחסון רשומות שבועיות של מזונות חדשים.
    כל רשומה מכילה רשימה של מזונות שהמשתמש ניסה השבוע.
    """
    __tablename__ = "weekly_notes"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id=Column(Integer, ForeignKey("users.id"), nullable=False)
    week_start_date = Column(String, nullable=False)  # פורמט: YYYY-MM-DD
    # store as JSONB for Postgres
    new_foods = Column(JSONB, nullable=False)  # רשימה: [{food_name, difficulty_level, notes}, ...]
    created_at = Column(DateTime, default=datetime.utcnow)
    
    #relationship
    user = relationship("User", back_populates="weekly_notes")  # 🆕