from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.auth import UserCreate, UserLogin, UserResponse, Token
from app.services.auth_service import create_user, login_user
from app.utils.dependencies import get_current_user
from app.models.user import User

router = APIRouter(
    prefix="/api/v1/auth",
    tags=["authentication"]
)


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(user_data: UserCreate, db: Session = Depends(get_db)):
    """
    רישום משתמש חדש.
    
    Body:
        - email: כתובת מייל (חייבת להיות ייחודית)
        - password: סיסמה (לפחות 6 תווים)
        - name: שם מלא
    
    Returns:
        פרטי המשתמש שנוצר (בלי סיסמה)
    """
    user = create_user(user_data, db)
    return user


@router.post("/login", response_model=Token)
def login(credentials: UserLogin, db: Session = Depends(get_db)):
    """
    התחברות משתמש.
    
    Body:
        - email: כתובת מייל
        - password: סיסמה
    
    Returns:
        JWT token (שמור אותו בצד הלקוח!)
    """
    token = login_user(credentials.email, credentials.password, db)
    return token


@router.get("/me", response_model=UserResponse)
def get_current_user_info(current_user: User = Depends(get_current_user)):
    """
    קבלת פרטי המשתמש המחובר.
    
    Headers:
        - Authorization: Bearer <token>
    
    Returns:
        פרטי המשתמש
    """
    return current_user


@router.put("/profile", response_model=UserResponse)
def update_profile(
    name: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    עדכון פרופיל משתמש.
    
    Headers:
        - Authorization: Bearer <token>
    
    Query Parameters:
        - name: שם חדש
    
    Returns:
        פרטי המשתמש המעודכן
    """
    current_user.name = name
    db.commit()
    db.refresh(current_user)
    return current_user