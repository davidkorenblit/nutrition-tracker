from pydantic import BaseModel, field_validator
from datetime import datetime
from app.utils.validators import validate_date_format_pydantic


class SnackCreate(BaseModel):
    date: str
    description: str
    
    @field_validator('date')
    @classmethod
    def validate_date_field(cls, v):
        return validate_date_format_pydantic(v)


class SnackResponse(BaseModel):
    id: int
    date: str
    description: str
    timestamp: datetime
    
    class Config:
        from_attributes = True