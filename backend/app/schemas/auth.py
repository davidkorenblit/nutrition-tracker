from pydantic import BaseModel, EmailStr, field_validator
from datetime import datetime
from typing import Optional
import re


class UserCreate(BaseModel):
    """Schema לרישום משתמש חדש"""
    email: EmailStr
    password: str
    name: str
    
    @field_validator('password')
    @classmethod
    def validate_password(cls, v):
        """
        ודא שהסיסמה חזקה מספיק:
        - לפחות 8 תווים
        - לפחות אות גדולה אחת
        - לפחות אות קטנה אחת
        - לפחות ספרה אחת
        - לפחות תו מיוחד אחד
        """
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        
        if not re.search(r'[A-Z]', v):
            raise ValueError('Password must contain at least one uppercase letter')
        
        if not re.search(r'[a-z]', v):
            raise ValueError('Password must contain at least one lowercase letter')
        
        if not re.search(r'\d', v):
            raise ValueError('Password must contain at least one digit')
        
        if not re.search(r'[!@#$%^&*(),.?":{}|<>]', v):
            raise ValueError('Password must contain at least one special character (!@#$%^&*(),.?":{}|<>)')
        
        return v
    
    @field_validator('name')
    @classmethod
    def validate_name(cls, v):
        """ודא ששם לא ריק"""
        if not v or len(v.strip()) == 0:
            raise ValueError('Name cannot be empty')
        return v.strip()


class UserLogin(BaseModel):
    """Schema להתחברות"""
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    """Schema להחזרת פרטי משתמש (בלי סיסמה!)"""
    id: int
    email: str
    name: str
    is_active: bool
    is_verified: bool  # NEW: האם המייל מאומת
    created_at: datetime
    role: str
    
    class Config:
        from_attributes = True


class Token(BaseModel):
    """Schema להחזרת JWT token"""
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    """Schema למידע בתוך ה-token"""
    user_id: Optional[int] = None
    role: Optional[str] = None


class VerifyEmailRequest(BaseModel):
    """Schema לבקשת אימות מייל"""
    code: str


class ResendVerificationRequest(BaseModel):
    """Schema לבקשת שליחה מחדש של מייל אימות"""
    email: EmailStr