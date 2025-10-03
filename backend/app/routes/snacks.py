from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.snack import Snack
from app.schemas.snack import SnackCreate, SnackResponse
from typing import List

router = APIRouter(
    prefix="/api/v1/snacks",
    tags=["snacks"]
)

# יצירת נשנוש
@router.post("/", response_model=SnackResponse)
def create_snack(snack: SnackCreate, db: Session = Depends(get_db)):
    new_snack = Snack(
        date=snack.date,
        description=snack.description
    )
    db.add(new_snack)
    db.commit()
    db.refresh(new_snack)
    return new_snack

# קבלת נשנושים
@router.get("/", response_model=List[SnackResponse])
def get_snacks(date: str = None, db: Session = Depends(get_db)):
    if date:
        snacks = db.query(Snack).filter(Snack.date == date).all()
    else:
        snacks = db.query(Snack).all()
    return snacks

# מחיקת נשנוש
@router.delete("/{snack_id}")
def delete_snack(snack_id: int, db: Session = Depends(get_db)):
    snack = db.query(Snack).filter(Snack.id == snack_id).first()
    if not snack:
        raise HTTPException(status_code=404, detail="Snack not found")
    
    db.delete(snack)
    db.commit()
    return {"message": "Snack deleted successfully"}