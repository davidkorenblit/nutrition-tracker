from pydantic import BaseModel, field_validator
from typing import Literal

class PlateCreate(BaseModel):
    """
    Schema ליצירת Free Plate.
    Healthy Plate נוצרת אוטומטית ולא צריכה input מהמשתמש.
    """
    meal_id: int
    plate_type: Literal["healthy", "free"]
    vegetables_percent: int
    protein_percent: int
    carbs_percent: int
    
    @field_validator('vegetables_percent', 'protein_percent', 'carbs_percent')
    @classmethod
    def validate_percentage(cls, v):
        """ודא שהאחוז בין 0 ל-100"""
        if not 0 <= v <= 100:
            raise ValueError('Percentage must be between 0 and 100')
        return v
    
    @field_validator('carbs_percent')
    @classmethod
    def validate_sum(cls, v, info):
        """ודא שסכום האחוזים = 100%"""
        vegetables = info.data.get('vegetables_percent', 0)
        protein = info.data.get('protein_percent', 0)
        total = vegetables + protein + v
        if total != 100:
            raise ValueError(f'Percentages must sum to 100, got {total}')
        return v


class PlateResponse(BaseModel):
    """Schema להחזרת צלחת"""
    id: int
    meal_id: int
    plate_type: str
    vegetables_percent: int
    protein_percent: int
    carbs_percent: int
    
    class Config:
        from_attributes = True