from pydantic import BaseModel, field_validator
from typing import List
from datetime import datetime
from app.utils.validators import validate_date_format_pydantic


class WeeklyFoodItem(BaseModel):
    """מזון בודד שנוסה השבוע"""
    food_name: str
    difficulty_level: int
    notes: str = ""
    
    @field_validator('difficulty_level')
    @classmethod
    def validate_difficulty(cls, v):
        if not 1 <= v <= 10:
            raise ValueError('Difficulty level must be between 1 and 10')
        return v


class WeeklyNotesCreate(BaseModel):
    """Schema ליצירת רשומה שבועית"""
    week_start_date: str
    new_foods: List[WeeklyFoodItem]
    
    @field_validator('week_start_date')
    @classmethod
    def validate_week_date(cls, v):
        return validate_date_format_pydantic(v)
    
    @field_validator('new_foods')
    @classmethod
    def validate_foods_list(cls, v):
        if len(v) == 0:
            raise ValueError('Must include at least one new food item')
        return v


class WeeklyNotesResponse(BaseModel):
    """Schema להחזרת רשומה שבועית"""
    id: int
    week_start_date: str
    new_foods: List[WeeklyFoodItem]
    created_at: datetime
    
    class Config:
        from_attributes = True