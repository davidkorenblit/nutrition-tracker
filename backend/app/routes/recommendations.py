from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.nutritionist_recommendations import NutritionistRecommendations
from app.schemas.recommendation import (
    RecommendationUpload,
    RecommendationResponse,
    RecommendationTagUpdate
)
from app.services.file_service import (
    save_word_file,
    parse_word_file,
    extract_recommendations_section,
    parse_recommendations_to_list,
    delete_word_file
)
from typing import List

router = APIRouter(
    prefix="/api/v1/recommendations",
    tags=["recommendations"]
)


@router.post("/upload", response_model=RecommendationResponse)
async def upload_word_file(
    visit_date: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    העלאת קובץ Word עם המלצות תזונאיות.
    
    Form Data:
        - visit_date: תאריך הביקור (YYYY-MM-DD)
        - file: קובץ Word (.docx)
    
    Returns:
        ההמלצות שנוצרו
    """
    # 1. שמור את הקובץ
    file_path = await save_word_file(file)
    
    # 2. חלץ טקסט
    raw_text = parse_word_file(file_path)
    
    # 3. חלץ סעיף המלצות
    recommendations_text = extract_recommendations_section(raw_text)
    
    # 4. המר לרשימה
    recommendations_list = parse_recommendations_to_list(recommendations_text)
    
    # 5. שמור ב-DB
    db_recommendation = NutritionistRecommendations(
        visit_date=visit_date,
        file_path=file_path,
        raw_text=raw_text,
        recommendations=recommendations_list
    )
    
    db.add(db_recommendation)
    db.commit()
    db.refresh(db_recommendation)
    
    return db_recommendation


@router.get("/", response_model=List[RecommendationResponse])
def get_all_recommendations(db: Session = Depends(get_db)):
    """
    קבלת כל ההמלצות.
    
    Returns:
        רשימת כל ההמלצות
    """
    return db.query(NutritionistRecommendations).all()


@router.get("/{recommendation_id}", response_model=RecommendationResponse)
def get_recommendation(recommendation_id: int, db: Session = Depends(get_db)):
    """
    קבלת המלצות ספציפיות לפי ID.
    
    Path Parameter:
        - recommendation_id: ID של ההמלצות
    
    Returns:
        ההמלצות
    """
    rec = db.query(NutritionistRecommendations).filter(
        NutritionistRecommendations.id == recommendation_id
    ).first()
    
    if not rec:
        raise HTTPException(
            status_code=404,
            detail=f"Recommendations with id {recommendation_id} not found"
        )
    
    return rec


@router.put("/{recommendation_id}/tag", response_model=RecommendationResponse)
def tag_recommendation(
    recommendation_id: int,
    tag_data: RecommendationTagUpdate,
    db: Session = Depends(get_db)
):
    """
    תיוג ידני של המלצה ספציפית.
    
    Path Parameter:
        - recommendation_id: ID של ההמלצות
    
    Body:
        - recommendation_item_id: ID של ההמלצה בתוך הרשימה
        - category: קטגוריה (new_food/quantity/habit/general)
        - tracked: האם לעקוב?
        - target_value: ערך יעד (אופציונלי)
        - notes: הערות (אופציונלי)
    
    Returns:
        ההמלצות המעודכנות
    """
    rec = db.query(NutritionistRecommendations).filter(
        NutritionistRecommendations.id == recommendation_id
    ).first()
    
    if not rec:
        raise HTTPException(
            status_code=404,
            detail=f"Recommendations with id {recommendation_id} not found"
        )
    
    # עדכן את ההמלצה הספציפית ב-JSON
    recommendations = rec.recommendations
    updated = False
    
    for item in recommendations:
        if item["id"] == tag_data.recommendation_item_id:
            item["category"] = tag_data.category
            item["tracked"] = tag_data.tracked
            item["target_value"] = tag_data.target_value
            item["notes"] = tag_data.notes
            updated = True
            break
    
    if not updated:
        raise HTTPException(
            status_code=404,
            detail=f"Recommendation item {tag_data.recommendation_item_id} not found"
        )
    
    rec.recommendations = recommendations
    db.commit()
    db.refresh(rec)
    
    return rec


@router.delete("/{recommendation_id}")
def delete_recommendation(recommendation_id: int, db: Session = Depends(get_db)):
    """
    מחיקת המלצות.
    
    Path Parameter:
        - recommendation_id: ID של ההמלצות
    
    Returns:
        הודעת הצלחה
    """
    rec = db.query(NutritionistRecommendations).filter(
        NutritionistRecommendations.id == recommendation_id
    ).first()
    
    if not rec:
        raise HTTPException(
            status_code=404,
            detail=f"Recommendations with id {recommendation_id} not found"
        )
    
    # מחק גם את הקובץ
    delete_word_file(rec.file_path)
    
    # מחק מה-DB
    db.delete(rec)
    db.commit()
    
    return {"message": f"Recommendations {recommendation_id} deleted successfully"}