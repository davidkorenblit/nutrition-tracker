from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.weekly_notes import WeeklyNotes
from app.models.user import User
from app.schemas.weekly import WeeklyNotesCreate, WeeklyNotesResponse
from app.services.weekly_service import create_weekly_notes
from app.utils.dependencies import get_current_user
from typing import List

router = APIRouter(
    prefix="/api/v1/weekly",
    tags=["weekly-notes"]
)

@router.post("/", response_model=WeeklyNotesResponse)
def create_notes(
    notes_data: WeeklyNotesCreate, 
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # המרת Pydantic objects ל-dicts
    foods_list = [food.model_dump() for food in notes_data.new_foods]
    
    weekly_notes = create_weekly_notes(
        week_start_date=notes_data.week_start_date,
        new_foods=foods_list,
        user_id=current_user.id,
        db=db
    )
    
    return weekly_notes


@router.get("/", response_model=List[WeeklyNotesResponse])
def get_all_notes(
    week_start_date: str = None, 
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if week_start_date:
        notes = db.query(WeeklyNotes).filter(
            WeeklyNotes.week_start_date == week_start_date,
            WeeklyNotes.user_id == current_user.id
        ).all()
    else:
        notes = db.query(WeeklyNotes).filter(
            WeeklyNotes.user_id == current_user.id
        ).all()
    
    return notes


@router.get("/{notes_id}", response_model=WeeklyNotesResponse)
def get_notes_by_id(
    notes_id: int, 
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    notes = db.query(WeeklyNotes).filter(
        WeeklyNotes.id == notes_id,
        WeeklyNotes.user_id == current_user.id
    ).first()
    
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
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    notes = db.query(WeeklyNotes).filter(
        WeeklyNotes.id == notes_id,
        WeeklyNotes.user_id == current_user.id
    ).first()
    
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
def delete_notes(
    notes_id: int, 
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    notes = db.query(WeeklyNotes).filter(
        WeeklyNotes.id == notes_id,
        WeeklyNotes.user_id == current_user.id
    ).first()
    
    if not notes:
        raise HTTPException(
            status_code=404,
            detail=f"Weekly notes with id {notes_id} not found"
        )
    
    db.delete(notes)
    db.commit()
    
    return {"message": f"Weekly notes {notes_id} deleted successfully"}