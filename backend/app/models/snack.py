from sqlalchemy import Column, Integer, String, DateTime
from datetime import datetime
from app.database import Base

class Snack(Base):
    __tablename__ = "snacks"
    
    id = Column(Integer, primary_key=True, index=True)
    date = Column(String, nullable=False)
    description = Column(String)
    timestamp = Column(DateTime, default=datetime.utcnow)