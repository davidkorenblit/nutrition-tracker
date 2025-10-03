from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.weekly import WeeklyNotesCreate, WeeklyNotesResponse
from app.services.weekly_service import create_weekly_notes, get_weekly_notes_by_week
from app.models.weekly_notes import WeeklyNotes
from typing import List

router = APIRouter(
    prefix="/api/v1/weekly",
    tags=["weekly-notes"]
)

@router.post("/", response_model=WeeklyNotesResponse)
def create_notes(notes_data: WeeklyNotesCreate, db: Session = Depends(get_db)):
    """
    יצירת רשומה שבועית חדשה.
    
    Body:
        - week_start_date: תאריך תחילת השבוע (YYYY-MM-DD)
        - new_foods: רשימת מזונות חדשים
          [
            {
              "food_name": "שם המזון",
              "difficulty_level": 1-10,
              "notes": "הערות (אופציונלי)"
            },
            ...
          ]
    
    Returns:
        הרשומה השבועית שנוצרה
    """
    # המרת Pydantic objects ל-dicts
    foods_list = [food.model_dump() for food in notes_data.new_foods]
    
    weekly_notes = create_weekly_notes(
        week_start_date=notes_data.week_start_date,
        new_foods=foods_list,
        db=db
    )
    
    return weekly_notes


@router.get("/", response_model=List[WeeklyNotesResponse])
def get_all_notes(week_start_date: str = None, db: Session = Depends(get_db)):
    """
    קבלת כל הרשומות השבועיות.
    ניתן לסנן לפי שבוע מסוים.
    
    Query Parameters:
        - week_start_date (אופציונלי): סינון לפי שבוע (YYYY-MM-DD)
    
    Returns:
        רשימת רשומות שבועיות
    """
    if week_start_date:
        # סינון לפי שבוע מסוים
        notes = db.query(WeeklyNotes).filter(
            WeeklyNotes.week_start_date == week_start_date
        ).all()
    else:
        # כל הרשומות
        notes = db.query(WeeklyNotes).all()
    
    return notes


@router.get("/{notes_id}", response_model=WeeklyNotesResponse)
def get_notes_by_id(notes_id: int, db: Session = Depends(get_db)):
    """
    קבלת רשומה שבועית לפי ID.
    
    Path Parameter:
        - notes_id: ID של הרשומה
    
    Returns:
        הרשומה השבועית
    """
    notes = db.query(WeeklyNotes).filter(WeeklyNotes.id == notes_id).first()
    
    if not notes:
        raise HTTPException(
            status_code=404,
            detail=f"Weekly notes with id {notes_id} not found"
        )
    
    return notes


@router.put("/{notes_id}", response_model=WeeklyNotesResponse)
def update_notes(
    notes_id: int, 
    notes_data: WeeklyNotesCreate, 
    db: Session = Depends(get_db)
):
    """
    עדכון רשומה שבועית קיימת.
    
    Path Parameter:
        - notes_id: ID של הרשומה
    
    Body:
        - week_start_date: תאריך חדש (אופציונלי)
        - new_foods: רשימת מזונות מעודכנת
    
    Returns:
        הרשומה המעודכנת
    """
    notes = db.query(WeeklyNotes).filter(WeeklyNotes.id == notes_id).first()
    
    if not notes:
        raise HTTPException(
            status_code=404,
            detail=f"Weekly notes with id {notes_id} not found"
        )
    
    # עדכון השדות
    notes.week_start_date = notes_data.week_start_date
    notes.new_foods = [food.model_dump() for food in notes_data.new_foods]
    
    db.commit()
    db.refresh(notes)
    
    return notes


@router.delete("/{notes_id}")
def delete_notes(notes_id: int, db: Session = Depends(get_db)):
    """
    מחיקת רשומה שבועית.
    
    Path Parameter:
        - notes_id: ID של הרשומה
    
    Returns:
        הודעת הצלחה
    """
    notes = db.query(WeeklyNotes).filter(WeeklyNotes.id == notes_id).first()
    
    if not notes:
        raise HTTPException(
            status_code=404,
            detail=f"Weekly notes with id {notes_id} not found"
        )
    
    db.delete(notes)
    db.commit()
    
    return {"message": f"Weekly notes {notes_id} deleted successfully"}