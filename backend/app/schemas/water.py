from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional

class WaterLogBase(BaseModel):
    amount_ml: float = Field(..., gt=0, description="Amount of water in milliliters")

class WaterLogCreate(WaterLogBase):
    pass

class WaterLogResponse(WaterLogBase):
    id: int
    user_id: int
    logged_at: datetime
    
    class Config:
        from_attributes = True

class WaterLogUpdate(BaseModel):
    amount_ml: Optional[float] = Field(None, gt=0)