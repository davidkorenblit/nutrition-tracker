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
        """ודא שהסיסמה חזקה מספיק"""
        if len(v) < 6:
            raise ValueError('Password must be at least 6 characters long')
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
    created_at: datetime
    
    class Config:
        from_attributes = True


class Token(BaseModel):
    """Schema להחזרת JWT token"""
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    """Schema למידע בתוך ה-token"""
    user_id: Optional[int] = None