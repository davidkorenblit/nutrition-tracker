from pydantic import BaseModel, field_validator
from datetime import datetime
from typing import Literal

class HungerLogCreate(BaseModel):
    """Schema ליצירת רישום רעב"""
    meal_id: int
    log_type: Literal["before", "during", "after"]
    hunger_level: int
    
    @field_validator('hunger_level')
    @classmethod
    def validate_hunger_level(cls, v):
        """ודא שרמת הרעב בין 1 ל-10"""
        if not 1 <= v <= 10:
            raise ValueError('Hunger level must be between 1 and 10')
        return v


class HungerLogResponse(BaseModel):
    """Schema להחזרת רישום רעב"""
    id: int
    meal_id: int
    log_type: str
    hunger_level: int
    timestamp: datetime
    
    class Config:
        from_attributes = True