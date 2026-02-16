from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.utils.security import decode_access_token

# Bearer token scheme
security = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """
    Dependency לקבלת המשתמש המחובר מ-JWT token.
    
    Args:
        credentials: Bearer token מה-request header
        db: database session
    
    Returns:
        User: המשתמש המחובר
    
    Raises:
        HTTPException: אם ה-token לא תקין או המשתמש לא קיים
    """
    # פענוח token
    token = credentials.credentials
    payload = decode_access_token(token)
    
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    # חילוץ user_id מה-token
    user_id: int = payload.get("user_id")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    # שליפת המשתמש מה-DB
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    # בדיקה שהמשתמש פעיל
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user"
        )
    
    return user


def get_current_admin_user(current_user: User = Depends(get_current_user)) -> User:
    """
    Dependency לקבלת משתמש admin בלבד.
    
    Args:
        current_user: המשתמש המחובר
    
    Returns:
        User: המשתמש המחובר אם הוא admin
    
    Raises:
        HTTPException: אם המשתמש לא admin
    """
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    return current_user