from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.compliance import Compliance
from app.models.user import User
from app.schemas.compliance import (
    ComplianceCheckResponse,
    ComplianceCheckCreate,
    ComplianceScoreSummary
)
from app.services.compliance_service import (
    run_compliance_check,
    get_latest_compliance_check,
    get_compliance_history
)
from app.utils.dependencies import get_current_user
from typing import List
from datetime import datetime, timedelta

router = APIRouter(
    prefix="/api/v1/compliance",
    tags=["compliance"]
)


@router.post("/check", response_model=ComplianceCheckResponse)
def trigger_compliance_check(
    check_data: ComplianceCheckCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    טריגר ידני לבדיקת עמידה.
    מריץ את כל 4 הבדיקות ושומר את התוצאות.
    """
    # ולידציה של תאריכים
    try:
        period_start = datetime.strptime(check_data.period_start, "%Y-%m-%d")
        period_end = datetime.strptime(check_data.period_end, "%Y-%m-%d")
        
        if period_end <= period_start:
            raise HTTPException(
                status_code=400,
                detail="period_end must be after period_start"
            )
        
        if (period_end - period_start).days > 90:
            raise HTTPException(
                status_code=400,
                detail="Period cannot exceed 90 days"
            )
            
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail="Invalid date format. Use YYYY-MM-DD"
        )
    
    # בדיקה אם כבר קיימת בדיקה לאותה תקופה
    existing = db.query(Compliance).filter(
        Compliance.user_id == current_user.id,
        Compliance.period_start == check_data.period_start,
        Compliance.period_end == check_data.period_end
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=409,
            detail="Compliance check already exists for this period. Delete it first to re-run."
        )
    
    # הרצת הבדיקה
    compliance = run_compliance_check(
        user_id=current_user.id,
        period_start=check_data.period_start,
        period_end=check_data.period_end,
        db=db
    )
    
    return compliance


@router.get("/latest", response_model=ComplianceCheckResponse)
def get_latest_check(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    שליפת בדיקת העמידה האחרונה
    """
    compliance = get_latest_compliance_check(current_user.id, db)
    
    if not compliance:
        raise HTTPException(
            status_code=404,
            detail="No compliance checks found. Run a check first."
        )
    
    return compliance


@router.get("/history", response_model=List[ComplianceCheckResponse])
def get_check_history(
    limit: int = 10,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    שליפת היסטוריית בדיקות עמידה
    """
    if limit > 50:
        raise HTTPException(
            status_code=400,
            detail="Limit cannot exceed 50"
        )
    
    compliances = get_compliance_history(current_user.id, limit, db)
    return compliances


@router.get("/summary", response_model=List[ComplianceScoreSummary])
def get_scores_summary(
    limit: int = 5,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    סיכום ציונים בלבד (ללא פירוטים) - קל יותר לתצוגה גרפית
    """
    if limit > 20:
        raise HTTPException(
            status_code=400,
            detail="Limit cannot exceed 20"
        )
    
    compliances = get_compliance_history(current_user.id, limit, db)
    
    summaries = []
    for c in compliances:
        summaries.append({
            "period_start": c.period_start,
            "period_end": c.period_end,
            "water_intake_score": c.water_intake_score,
            "new_foods_score": c.new_foods_score,
            "recommendations_match_score": c.recommendations_match_score,
            "healthy_plates_ratio_score": c.healthy_plates_ratio_score,
            "overall_score": c.overall_score
        })
    
    return summaries


@router.delete("/{compliance_id}")
def delete_compliance_check(
    compliance_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    מחיקת בדיקת עמידה
    """
    compliance = db.query(Compliance).filter(
        Compliance.id == compliance_id,
        Compliance.user_id == current_user.id
    ).first()
    
    if not compliance:
        raise HTTPException(
            status_code=404,
            detail=f"Compliance check with id {compliance_id} not found"
        )
    
    db.delete(compliance)
    db.commit()
    
    return {"message": f"Compliance check {compliance_id} deleted successfully"}


@router.get("/auto-check-due")
def check_if_auto_check_due(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    בדיקה אם הגיע הזמן לבדיקה אוטומטית (לפי תדירות שהמשתמש הגדיר)
    """
    latest = get_latest_compliance_check(current_user.id, db)
    
    if not latest:
        # אין בדיקות קודמות - צריך להריץ
        return {
            "due": True,
            "message": "No previous checks found. You should run an initial check.",
            "days_since_last_check": None,
            "frequency_days": current_user.compliance_check_frequency_days
        }
    
    days_since_last = (datetime.utcnow() - latest.check_date).days
    
    if days_since_last >= current_user.compliance_check_frequency_days:
        # הגיע הזמן
        return {
            "due": True,
            "message": f"It's been {days_since_last} days since your last check.",
            "days_since_last_check": days_since_last,
            "frequency_days": current_user.compliance_check_frequency_days,
            "last_check_date": latest.check_date.isoformat()
        }
    else:
        # עדיין לא הגיע הזמן
        days_remaining = current_user.compliance_check_frequency_days - days_since_last
        return {
            "due": False,
            "message": f"Next check due in {days_remaining} days.",
            "days_since_last_check": days_since_last,
            "frequency_days": current_user.compliance_check_frequency_days,
            "last_check_date": latest.check_date.isoformat(),
            "days_remaining": days_remaining
        }