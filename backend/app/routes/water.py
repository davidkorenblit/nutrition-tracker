from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.schemas.water import WaterLogCreate, WaterLogResponse, WaterLogUpdate
from app.services.water_service import (
    create_water_log, 
    get_water_logs_by_date, 
    get_total_water_by_date,
    delete_water_log,
    update_water_log
)
from app.utils.dependencies import get_current_user
from typing import List
from datetime import date

router = APIRouter(
    prefix="/api/v1/water",
    tags=["water"]
)

@router.post("/", response_model=WaterLogResponse)
def create_log(
    log_data: WaterLogCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    water_log = create_water_log(
        user_id=current_user.id,
        amount_ml=log_data.amount_ml,
        db=db
    )
    return water_log

@router.get("/logs", response_model=List[WaterLogResponse])
def get_logs_by_date(
    date_param: date = Query(..., alias="date"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    logs = get_water_logs_by_date(
        user_id=current_user.id,
        target_date=date_param,
        db=db
    )
    return logs

@router.get("/total")
def get_total_water(
    date_param: date = Query(..., alias="date"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    total = get_total_water_by_date(
        user_id=current_user.id,
        target_date=date_param,
        db=db
    )
    return {"date": date_param, "total_ml": total}

@router.delete("/{log_id}")
def delete_log(
    log_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    success = delete_water_log(
        log_id=log_id,
        user_id=current_user.id,
        db=db
    )
    
    if not success:
        raise HTTPException(
            status_code=404,
            detail="Water log not found"
        )
    
    return {"message": "Water log deleted successfully"}

@router.put("/{log_id}", response_model=WaterLogResponse)
def update_log(
    log_id: int,
    log_data: WaterLogUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if log_data.amount_ml is None:
        raise HTTPException(
            status_code=400,
            detail="amount_ml is required"
        )
    
    updated_log = update_water_log(
        log_id=log_id,
        user_id=current_user.id,
        amount_ml=log_data.amount_ml,
        db=db
    )
    
    if not updated_log:
        raise HTTPException(
            status_code=404,
            detail="Water log not found"
        )
    
    return updated_log