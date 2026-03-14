from sqlalchemy import Column, Integer, String, DateTime, ForeignKey  # הוסף ForeignKey
from sqlalchemy.orm import relationship  # אם אין
from datetime import datetime, timezone
from app.database import Base

class Snack(Base):
    __tablename__ = "snacks"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    date = Column(String, nullable=False)
    description = Column(String)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    #relationship
    user = relationship("User", back_populates="snacks")

