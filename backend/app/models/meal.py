from sqlalchemy import Column, Integer, String, DateTime, ForeignKey  
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class Meal(Base):
    __tablename__ = "meals"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)  
    meal_type = Column(String, nullable=False)
    date = Column(String, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)
    photo_url = Column(String, nullable=True)  
    notes = Column(String, nullable=True)

    
    # קשרים
    plates = relationship("Plate", back_populates="meal", cascade="all, delete-orphan")
    hunger_logs = relationship("HungerLog", back_populates="meal", cascade="all, delete-orphan")
    user = relationship("User", back_populates="meals")  # ✅ CORRECT!