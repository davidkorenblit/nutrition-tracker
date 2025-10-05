from pydantic import BaseModel, field_validator
from datetime import datetime
from typing import List, Optional, Literal
from app.utils.validators import validate_date_format_pydantic


class RecommendationItem(BaseModel):
    """המלצה בודדת בתוך רשימת ההמלצות"""
    id: int
    text: str
    category: Literal["new_food", "quantity", "habit", "general"]
    tracked: bool = False
    target_value: Optional[float] = None  # למשל: 2.5 ליטר מים
    notes: Optional[str] = None


class RecommendationUpload(BaseModel):
    """Schema להעלאת קובץ Word"""
    visit_date: str
    
    @field_validator('visit_date')
    @classmethod
    def validate_date_field(cls, v):
        return validate_date_format_pydantic(v)


class RecommendationResponse(BaseModel):
    """Schema להחזרת המלצות"""
    id: int
    visit_date: str
    file_path: str
    raw_text: Optional[str] = None
    recommendations: List[RecommendationItem]
    created_at: datetime
    
    class Config:
        from_attributes = True


class RecommendationTagUpdate(BaseModel):
    """Schema לתיוג ידני של המלצה"""
    recommendation_item_id: int
    category: Literal["new_food", "quantity", "habit", "general"]
    tracked: bool
    target_value: Optional[float] = None
    notes: Optional[str] = None