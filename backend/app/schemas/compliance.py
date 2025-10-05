from pydantic import BaseModel, field_validator
from datetime import datetime
from typing import Optional, Literal


class ComplianceCreate(BaseModel):
    """Schema לדיווח על עמידה בהמלצה"""
    recommendation_id: int
    recommendation_item_id: int
    visit_period: str  # "2025-10-30 to 2025-11-13"
    status: Literal["not_started", "in_progress", "completed", "abandoned"]
    completion_rate: float  # 0-100
    notes: Optional[str] = None
    
    @field_validator('completion_rate')
    @classmethod
    def validate_rate(cls, v):
        if not 0 <= v <= 100:
            raise ValueError('Completion rate must be between 0 and 100')
        return v


class ComplianceResponse(BaseModel):
    """Schema להחזרת דיווח עמידה"""
    id: int
    recommendation_id: int
    recommendation_item_id: int
    visit_period: str
    status: str
    completion_rate: float
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class ComplianceReportItem(BaseModel):
    """פריט בודד בדוח עמידה"""
    recommendation_text: str
    category: str
    status: str
    completion_rate: float
    notes: Optional[str] = None


class ComplianceReport(BaseModel):
    """דוח מסכם של עמידה בהמלצות"""
    visit_period: str
    total_recommendations: int
    completed: int
    in_progress: int
    not_started: int
    abandoned: int
    overall_completion_rate: float
    items: list[ComplianceReportItem]