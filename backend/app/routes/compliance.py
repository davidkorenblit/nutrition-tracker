from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.compliance import Compliance
from app.schemas.compliance import (
    ComplianceCreate,
    ComplianceResponse,
    ComplianceReport
)
from app.services.compliance_service import generate_compliance_report
from typing import List

router = APIRouter(
    prefix="/api/v1/compliance",
    tags=["compliance"]
)


@router.post("/", response_model=ComplianceResponse)
def create_compliance(
    compliance_data: ComplianceCreate,
    db: Session = Depends(get_db)
):
    """
    דיווח על עמידה בהמלצה.
    
    Body:
        - recommendation_id: ID של המלצות הביקור
        - recommendation_item_id: ID של ההמלצה הספציפית
        - visit_period: תקופת הביקור (למשל: "2025-10-30 to 2025-11-13")
        - status: סטטוס (not_started/in_progress/completed/abandoned)
        - completion_rate: אחוז ביצוע (0-100)
        - notes: הערות (אופציונלי)
    
    Returns:
        דיווח העמידה שנוצר
    """
    # בדוק אם כבר קיים דיווח לאותה המלצה באותה תקופה
    existing = db.query(Compliance).filter(
        Compliance.recommendation_id == compliance_data.recommendation_id,
        Compliance.recommendation_item_id == compliance_data.recommendation_item_id,
        Compliance.visit_period == compliance_data.visit_period
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=409,
            detail="Compliance report already exists for this recommendation in this period"
        )
    
    compliance = Compliance(
        recommendation_id=compliance_data.recommendation_id,
        recommendation_item_id=compliance_data.recommendation_item_id,
        visit_period=compliance_data.visit_period,
        status=compliance_data.status,
        completion_rate=compliance_data.completion_rate,
        notes=compliance_data.notes
    )
    
    db.add(compliance)
    db.commit()
    db.refresh(compliance)
    
    return compliance


@router.get("/report", response_model=ComplianceReport)
def get_compliance_report(
    recommendation_id: int,
    visit_period: str,
    db: Session = Depends(get_db)
):
    """
    קבלת דוח עמידה מסכם.
    
    Query Parameters:
        - recommendation_id: ID של המלצות הביקור
        - visit_period: תקופת הביקור
    
    Returns:
        דוח מסכם
    """
    report = generate_compliance_report(recommendation_id, visit_period, db)
    return report


@router.get("/{recommendation_id}", response_model=List[ComplianceResponse])
def get_compliance_by_recommendation(
    recommendation_id: int,
    db: Session = Depends(get_db)
):
    """
    קבלת כל דיווחי העמידה להמלצות ספציפיות.
    
    Path Parameter:
        - recommendation_id: ID של ההמלצות
    
    Returns:
        רשימת דיווחי עמידה
    """
    compliances = db.query(Compliance).filter(
        Compliance.recommendation_id == recommendation_id
    ).all()
    
    return compliances


@router.put("/{compliance_id}", response_model=ComplianceResponse)
def update_compliance(
    compliance_id: int,
    compliance_data: ComplianceCreate,
    db: Session = Depends(get_db)
):
    """
    עדכון דיווח עמידה קיים.
    
    Path Parameter:
        - compliance_id: ID של הדיווח
    
    Body:
        - נתונים מעודכנים
    
    Returns:
        הדיווח המעודכן
    """
    compliance = db.query(Compliance).filter(Compliance.id == compliance_id).first()
    
    if not compliance:
        raise HTTPException(
            status_code=404,
            detail=f"Compliance with id {compliance_id} not found"
        )
    
    compliance.status = compliance_data.status
    compliance.completion_rate = compliance_data.completion_rate
    compliance.notes = compliance_data.notes
    
    db.commit()
    db.refresh(compliance)
    
    return compliance


@router.delete("/{compliance_id}")
def delete_compliance(compliance_id: int, db: Session = Depends(get_db)):
    """
    מחיקת דיווח עמידה.
    
    Path Parameter:
        - compliance_id: ID של הדיווח
    
    Returns:
        הודעת הצלחה
    """
    compliance = db.query(Compliance).filter(Compliance.id == compliance_id).first()
    
    if not compliance:
        raise HTTPException(
            status_code=404,
            detail=f"Compliance with id {compliance_id} not found"
        )
    
    db.delete(compliance)
    db.commit()
    
    return {"message": f"Compliance {compliance_id} deleted successfully"}