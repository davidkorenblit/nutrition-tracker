from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.user import User
from app.models.verification_code import VerificationCode
from app.schemas.auth import UserCreate
from app.utils.security import get_password_hash, verify_password, create_access_token
from app.services.email_service import send_verification_email
from datetime import timedelta, datetime
import uuid


def create_user(user_data: UserCreate, db: Session) -> User:
    """
    יצירת משתמש חדש ושליחת מייל אימות.
    
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
    
    # צור משתמש חדש (לא מאומת)
    new_user = User(
        email=user_data.email,
        hashed_password=hashed_password,
        name=user_data.name,
        is_active=True,
        is_verified=False  # NEW: משתמש חדש לא מאומת
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # צור קוד אימות
    verification_code = str(uuid.uuid4())
    new_verification = VerificationCode(
        user_id=new_user.id,
        code=verification_code
    )
    db.add(new_verification)
    db.commit()
    
    # שלח מייל אימות
    email_sent = send_verification_email(new_user.email, verification_code)
    if not email_sent:
        # אם שליחת המייל נכשלה, עדיין נחזיר את המשתמש אבל נזרוק אזהרה
        print(f"Warning: Failed to send verification email to {new_user.email}")
    
    return new_user


def verify_email(verification_code: str, db: Session) -> bool:
    """
    אימות מייל של משתמש באמצעות קוד.
    
    Args:
        verification_code: קוד האימות שנשלח למייל
        db: database session
    
    Returns:
        True אם האימות הצליח
    
    Raises:
        HTTPException: אם הקוד לא תקין או פג תוקף
    """
    # מצא קוד אימות
    verification = db.query(VerificationCode).filter(
        VerificationCode.code == verification_code
    ).first()
    
    if not verification:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid verification code"
        )
    
    # בדוק אם הקוד כבר נוצל
    if verification.is_used:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Verification code already used"
        )
    
    # בדוק אם הקוד פג תוקף
    if datetime.utcnow() > verification.expires_at:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Verification code expired"
        )
    
    # אמת את המשתמש
    user = db.query(User).filter(User.id == verification.user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    user.is_verified = True
    verification.is_used = True
    
    db.commit()
    
    return True


def resend_verification_email(email: str, db: Session) -> bool:
    """
    שליחה מחדש של מייל אימות.
    
    Args:
        email: כתובת המייל של המשתמש
        db: database session
    
    Returns:
        True אם נשלח בהצלחה
    
    Raises:
        HTTPException: אם המשתמש לא נמצא או כבר מאומת
    """
    # מצא משתמש
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # בדוק אם כבר מאומת
    if user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already verified"
        )
    
    # מחק קודי אימות ישנים
    db.query(VerificationCode).filter(
        VerificationCode.user_id == user.id
    ).delete()
    
    # צור קוד אימות חדש
    verification_code = str(uuid.uuid4())
    new_verification = VerificationCode(
        user_id=user.id,
        code=verification_code
    )
    db.add(new_verification)
    db.commit()
    
    # שלח מייל
    email_sent = send_verification_email(user.email, verification_code)
    if not email_sent:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to send verification email"
        )
    
    return True


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
    
    # NEW: בדוק שהמייל מאומת
    if not user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Email not verified. Please check your email for verification link."
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
        data={"user_id": user.id, "email": user.email, "role": user.role},
        expires_delta=timedelta(hours=24)
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer"
    }