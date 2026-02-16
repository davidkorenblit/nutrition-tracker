from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base


class User(Base):
    """
    טבלת משתמשים.
    כל משתמש יכול להירשם, להתחבר, ולנהל את הנתונים שלו בלבד.
    """
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, nullable=False, index=True)
    hashed_password = Column(String, nullable=False)
    name = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)  
    created_at = Column(DateTime, default=datetime.utcnow)
    daily_water_goal_ml = Column(Integer, default=2000, nullable=False) 
    compliance_check_frequency_days = Column(Integer, default=14, nullable=False)
    role = Column(String, default="client", nullable=False)
    
    
    
    # קשרים לטבלאות אחרות (נוסיף בהמשך)
    meals = relationship("Meal", back_populates="user", cascade="all, delete-orphan")
    snacks = relationship("Snack", back_populates="user", cascade="all, delete-orphan")
    weekly_notes = relationship("WeeklyNotes", back_populates="user", cascade="all, delete-orphan")
    recommendations = relationship("NutritionistRecommendations", back_populates="user", cascade="all, delete-orphan")
    water_logs = relationship("WaterLog", back_populates="user")
