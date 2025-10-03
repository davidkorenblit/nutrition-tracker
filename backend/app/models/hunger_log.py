from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class HungerLog(Base):
    __tablename__ = "hunger_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    meal_id = Column(Integer, ForeignKey("meals.id"), nullable=False)
    log_type = Column(String, nullable=False)  # "before", "during", "after"
    hunger_level = Column(Integer, nullable=False)  # 1-10
    timestamp = Column(DateTime, default=datetime.utcnow)
    
    # קשר חזרה ל-Meal
    meal = relationship("Meal", back_populates="hunger_logs")