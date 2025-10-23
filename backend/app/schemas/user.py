from pydantic import BaseModel, Field

class UserSettingsUpdate(BaseModel):
    """Schema לעדכון הגדרות משתמש"""
    daily_water_goal_ml: int | None = Field(None, ge=500, le=10000)
    compliance_check_frequency_days: int | None = Field(None, ge=1, le=90)

class UserResponse(BaseModel):
    """Schema להחזרת פרטי משתמש"""
    id: int
    email: str
    name: str
    daily_water_goal_ml: int
    compliance_check_frequency_days: int
    
    class Config:
        from_attributes = True