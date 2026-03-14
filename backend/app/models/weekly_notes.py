from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
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
    # store as JSON (cross-database compatible; PostgreSQL stores as json type)
    new_foods = Column(JSON, nullable=False)  # רשימה: [{food_name, difficulty_level, notes}, ...]
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    
    #relationship
    user = relationship("User", back_populates="weekly_notes")  # 🆕