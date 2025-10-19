from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.nutritionist_recommendations import NutritionistRecommendations
from app.models.user import User
from app.schemas.recommendation import (
    RecommendationUpload,
    RecommendationResponse,
    RecommendationTagUpdate
)
from app.services.file_service import (
    save_word_file,
    parse_word_file,
    extract_recommendations_with_llm,
    delete_word_file
)
from app.utils.dependencies import get_current_user
from typing import List

router = APIRouter(
    prefix="/api/v1/recommendations",
    tags=["recommendations"]
)


@router.post("/upload", response_model=RecommendationResponse)
async def upload_word_file(
    visit_date: str = Query(...),
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        # 1. שמור את הקובץ
        print(f"📁 Saving file: {file.filename}")
        file_path = await save_word_file(file)
        print(f"✓ File saved to: {file_path}")
        
        # 2. חלץ טקסט
        print(f"📖 Parsing text from: {file_path}")
        raw_text = parse_word_file(file_path)
        print(f"✓ Raw text extracted (length: {len(raw_text)} chars)")
        print(f"📄 First 200 chars: {raw_text[:200]}")
        
    
        # 4. המר לרשימה
        print(f"📋 Parsing recommendations to list...")
        recommendations_list = extract_recommendations_with_llm(raw_text)
        print(f"✓ Parsed {len(recommendations_list)} recommendations")
        print(f"📊 List: {recommendations_list}")
        
        # 5. שמור ב-DB
        print(f"💾 Saving to database...")
        db_recommendation = NutritionistRecommendations(
            user_id=current_user.id,
            visit_date=visit_date,
            file_path=file_path,
            raw_text=raw_text,
            recommendations=recommendations_list
        )
        
        db.add(db_recommendation)
        db.commit()
        db.refresh(db_recommendation)
        print(f"✓ Successfully saved to database with id: {db_recommendation.id}")
        
        return db_recommendation
    
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        raise


@router.get("/", response_model=List[RecommendationResponse])
def get_all_recommendations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return db.query(NutritionistRecommendations).filter(
        NutritionistRecommendations.user_id == current_user.id
    ).all()


@router.get("/{recommendation_id}", response_model=RecommendationResponse)
def get_recommendation(
    recommendation_id: int, 
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    rec = db.query(NutritionistRecommendations).filter(
        NutritionistRecommendations.id == recommendation_id,
        NutritionistRecommendations.user_id == current_user.id
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
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    rec = db.query(NutritionistRecommendations).filter(
        NutritionistRecommendations.id == recommendation_id,
        NutritionistRecommendations.user_id == current_user.id
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
def delete_recommendation(
    recommendation_id: int, 
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    rec = db.query(NutritionistRecommendations).filter(
        NutritionistRecommendations.id == recommendation_id,
        NutritionistRecommendations.user_id == current_user.id
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