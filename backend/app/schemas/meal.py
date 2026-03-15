from pydantic import BaseModel, field_validator
from datetime import datetime
from typing import Optional, List
from app.utils.validators import validate_date_format_pydantic


class MealCreate(BaseModel):
    meal_type: str
    date: str
    
    @field_validator('date')
    @classmethod
    def validate_date_field(cls, v):
        return validate_date_format_pydantic(v)


class PlateResponse(BaseModel):
    """Response schema for Plate (nested in MealResponse)"""
    id: int
    meal_id: int
    plate_type: str
    vegetables_percent: int
    protein_percent: int
    carbs_percent: int
    
    class Config:
        from_attributes = True


class HungerLogResponse(BaseModel):
    """Response schema for HungerLog (nested in MealResponse)"""
    id: int
    meal_id: int
    log_type: str
    hunger_level: int
    timestamp: datetime
    
    class Config:
        from_attributes = True


class MealResponse(BaseModel):
    id: int
    meal_type: str
    date: str
    timestamp: datetime
    photo_url: Optional[str] = None
    notes: Optional[str] = None
    is_logged: bool = False
    plates: List[PlateResponse] = []  # 🆕 הוסף!
    hunger_logs: List[HungerLogResponse] = []  # 🆕 בונוס - גם hunger logs!
    
    class Config:
        from_attributes = True


class CompleteMealCreate(BaseModel):
    """
    Schema ליצירת ארוחה מלאה בבקשה אחת.
    משמש ב-POST /api/v1/meals/complete
    """
    meal_id: int
    
    # Free Plate
    free_plate_vegetables: int
    free_plate_protein: int
    free_plate_carbs: int
    
    # Hunger Logs
    hunger_before: int
    hunger_during: int
    hunger_after: int
    
    # Photo (אופציונלי)
    photo_url: Optional[str] = None
    #Text
    notes: Optional[str] = None