from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.user import User
from app.schemas.auth import UserCreate
from app.utils.security import get_password_hash, verify_password, create_access_token
from datetime import timedelta


def create_user(user_data: UserCreate, db: Session) -> User:
    """
    יצירת משתמש חדש.
    
    Args:
        user_data: נתוני המשתמש (email, password, name)
        db: database session
    
    Returns:
        User: המשתמש שנוצר
    
    Raises:
        HTTPException: אם המייל כבר קיים
    """
    # בדוק אם המייל כבר קיים
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # הצפן סיסמה
    hashed_password = get_password_hash(user_data.password)
    
    # צור משתמש חדש
    new_user = User(
        email=user_data.email,
        hashed_password=hashed_password,
        name=user_data.name,
        is_active=True
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return new_user


def authenticate_user(email: str, password: str, db: Session) -> User:
    """
    אימות משתמש (התחברות).
    
    Args:
        email: מייל המשתמש
        password: סיסמה בטקסט רגיל
        db: database session
    
    Returns:
        User: המשתמש אם האימות הצליח
    
    Raises:
        HTTPException: אם האימות נכשל
    """
    # מצא משתמש לפי email
    user = db.query(User).filter(User.email == email).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    # בדוק סיסמה
    if not verify_password(password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    # בדוק שהמשתמש פעיל
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user"
        )
    
    return user


def login_user(email: str, password: str, db: Session) -> dict:
    """
    התחברות משתמש והחזרת JWT token.
    
    Args:
        email: מייל המשתמש
        password: סיסמה
        db: database session
    
    Returns:
        dict: {"access_token": str, "token_type": "bearer"}
    """
    # אמת משתמש
    user = authenticate_user(email, password, db)
    
    # יצור JWT token
    access_token = create_access_token(
        data={"user_id": user.id, "email": user.email},
        expires_delta=timedelta(hours=24)
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer"
    }