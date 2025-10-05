from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime
from datetime import datetime
from app.database import Base

class Compliance(Base):
    """
    טבלה למעקב אחר עמידה בהמלצות בין ביקור לביקור.
    כל רשומה = דיווח על המלצה ספציפית בתקופה מסוימת.
    """
    __tablename__ = "compliance"
    
    id = Column(Integer, primary_key=True, index=True)
    recommendation_id = Column(Integer, ForeignKey("nutritionist_recommendations.id"), nullable=False)
    recommendation_item_id = Column(Integer, nullable=False)  # ID של ההמלצה בתוך ה-JSON
    visit_period = Column(String, nullable=False)  # "2025-10-30 to 2025-11-13"
    status = Column(String, nullable=False)  # "not_started" / "in_progress" / "completed" / "abandoned"
    completion_rate = Column(Float, nullable=False, default=0.0)  # 0-100%
    notes = Column(String, nullable=True)  # הערות חופשיות
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)