from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.compliance import Compliance
from app.models.nutritionist_recommendations import NutritionistRecommendations
from app.models.user import User
from app.schemas.compliance import (
    ComplianceCreate,
    ComplianceResponse,
    ComplianceReport
)
from app.services.compliance_service import generate_compliance_report
from app.utils.dependencies import get_current_user
from typing import List

router = APIRouter(
    prefix="/api/v1/compliance",
    tags=["compliance"]
)


@router.post("/", response_model=ComplianceResponse)
def create_compliance(
    compliance_data: ComplianceCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # וודא שההמלצות שייכות למשתמש
    rec = db.query(NutritionistRecommendations).filter(
        NutritionistRecommendations.id == compliance_data.recommendation_id,
        NutritionistRecommendations.user_id == current_user.id
    ).first()
    
    if not rec:
        raise HTTPException(
            status_code=404,
            detail="Recommendations not found"
        )
    
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
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # וודא שההמלצות שייכות למשתמש
    rec = db.query(NutritionistRecommendations).filter(
        NutritionistRecommendations.id == recommendation_id,
        NutritionistRecommendations.user_id == current_user.id
    ).first()
    
    if not rec:
        raise HTTPException(
            status_code=404,
            detail="Recommendations not found"
        )
    
    report = generate_compliance_report(recommendation_id, visit_period, db)
    return report


@router.get("/{recommendation_id}", response_model=List[ComplianceResponse])
def get_compliance_by_recommendation(
    recommendation_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # וודא שההמלצות שייכות למשתמש
    rec = db.query(NutritionistRecommendations).filter(
        NutritionistRecommendations.id == recommendation_id,
        NutritionistRecommendations.user_id == current_user.id
    ).first()
    
    if not rec:
        raise HTTPException(
            status_code=404,
            detail="Recommendations not found"
        )
    
    compliances = db.query(Compliance).filter(
        Compliance.recommendation_id == recommendation_id
    ).all()
    
    return compliances


@router.put("/{compliance_id}", response_model=ComplianceResponse)
def update_compliance(
    compliance_id: int,
    compliance_data: ComplianceCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    compliance = db.query(Compliance).filter(Compliance.id == compliance_id).first()
    
    if not compliance:
        raise HTTPException(
            status_code=404,
            detail=f"Compliance with id {compliance_id} not found"
        )
    
    # וודא שההמלצות שייכות למשתמש
    rec = db.query(NutritionistRecommendations).filter(
        NutritionistRecommendations.id == compliance.recommendation_id,
        NutritionistRecommendations.user_id == current_user.id
    ).first()
    
    if not rec:
        raise HTTPException(
            status_code=404,
            detail="Recommendations not found"
        )
    
    compliance.status = compliance_data.status
    compliance.completion_rate = compliance_data.completion_rate
    compliance.notes = compliance_data.notes
    
    db.commit()
    db.refresh(compliance)
    
    return compliance


@router.delete("/{compliance_id}")
def delete_compliance(
    compliance_id: int, 
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    compliance = db.query(Compliance).filter(Compliance.id == compliance_id).first()
    
    if not compliance:
        raise HTTPException(
            status_code=404,
            detail=f"Compliance with id {compliance_id} not found"
        )
    
    # וודא שההמלצות שייכות למשתמש
    rec = db.query(NutritionistRecommendations).filter(
        NutritionistRecommendations.id == compliance.recommendation_id,
        NutritionistRecommendations.user_id == current_user.id
    ).first()
    
    if not rec:
        raise HTTPException(
            status_code=404,
            detail="Recommendations not found"
        )
    
    db.delete(compliance)
    db.commit()
    
    return {"message": f"Compliance {compliance_id} deleted successfully"}