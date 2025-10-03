from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class Plate(Base):
    """
    טבלת צלחות - כל ארוחה מכילה 2 צלחות:
    1. Healthy Plate - קבועה (50% ירקות, 30% חלבון, 20% פחמימות)
    2. Free Plate - משתנה (המשתמש מזין אחוזים)
    """
    __tablename__ = "plates"
    
    id = Column(Integer, primary_key=True, index=True)
    meal_id = Column(Integer, ForeignKey("meals.id"), nullable=False)
    plate_type = Column(String, nullable=False)  # "healthy" or "free"
    
    # 🆕 שדות נפרדים במקום JSON
    vegetables_percent = Column(Integer, nullable=False)  # 0-100
    protein_percent = Column(Integer, nullable=False)     # 0-100
    carbs_percent = Column(Integer, nullable=False)       # 0-100
    
    # קשר חזרה ל-Meal
    meal = relationship("Meal", back_populates="plates")