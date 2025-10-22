from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime, timedelta
from app.database import Base


class VerificationCode(Base):
    """
    טבלת קודי אימות למייל.
    כל קוד תקף ל-24 שעות.
    """
    __tablename__ = "verification_codes"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    code = Column(String, unique=True, nullable=False, index=True)  # UUID
    created_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime, default=lambda: datetime.utcnow() + timedelta(hours=24))
    is_used = Column(Boolean, default=False)
    
    # קשר למשתמש
    user = relationship("User")