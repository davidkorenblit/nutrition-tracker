import os
import bcrypt
import logging
from datetime import datetime, timedelta, timezone
from typing import Optional
from jose import JWTError, jwt
from dotenv import load_dotenv

logger = logging.getLogger(__name__)

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY")
if not SECRET_KEY:
    logger.error("CRITICAL: SECRET_KEY environment variable not found!")
    logger.error("Please ensure SECRET_KEY is set or run: python generate_secret.py")
    # Raise error with descriptive message for debugging
    raise ValueError(
        "SECRET_KEY not configured! This is required for JWT token generation. "
        "Please set the SECRET_KEY environment variable or run 'python generate_secret.py' to generate one."
    )

logger.info("SECRET_KEY loaded successfully")

ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_HOURS = int(os.getenv("ACCESS_TOKEN_EXPIRE_HOURS", "24"))


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify plain password against hashed password with error handling"""
    try:
        if not plain_password or not hashed_password:
            logger.warning("Empty password or hash provided to verify_password")
            return False
        result = bcrypt.checkpw(
            plain_password.encode('utf-8'),
            hashed_password.encode('utf-8')
        )
        return result
    except ValueError as e:
        logger.error(f"Invalid bcrypt hash format: {str(e)}")
        return False
    except Exception as e:
        logger.error(f"Error verifying password: {str(e)}", exc_info=True)
        return False


def get_password_hash(password: str) -> str:
    """Hash password with error handling"""
    try:
        if not password:
            raise ValueError("Password cannot be empty")
        salt = bcrypt.gensalt()
        hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
        return hashed.decode('utf-8')
    except Exception as e:
        logger.error(f"Error hashing password: {str(e)}", exc_info=True)
        raise


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create JWT token with error handling"""
    try:
        to_encode = data.copy()
        
        if expires_delta:
            expire = datetime.now(timezone.utc) + expires_delta
        else:
            expire = datetime.now(timezone.utc) + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)
        
        to_encode.update({"exp": expire})
        logger.debug(f"Creating token for data keys: {list(to_encode.keys())}")
        
        encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
        return encoded_jwt
    except Exception as e:
        logger.error(f"Error creating access token: {str(e)}", exc_info=True)
        raise


def decode_access_token(token: str) -> Optional[dict]:
    """Decode JWT token with error handling"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError as e:
        logger.warning(f"Invalid JWT token: {str(e)}")
        return None
    except Exception as e:
        logger.error(f"Error decoding access token: {str(e)}", exc_info=True)
        return None
    except JWTError:
        return None