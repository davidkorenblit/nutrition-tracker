import os
import uuid
from fastapi import UploadFile, HTTPException
from supabase import create_client, Client
import logging

logger = logging.getLogger(__name__)

# Supabase Configuration
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

# Initialize Supabase client if credentials are available
supabase_client: Client = None
if SUPABASE_URL and SUPABASE_KEY:
    try:
        supabase_client = create_client(SUPABASE_URL, SUPABASE_KEY)
        logger.info("✅ Supabase client initialized for media storage")
    except Exception as e:
        logger.warning(f"⚠️  Failed to initialize Supabase: {e}")

BUCKET_NAME = os.getenv("MEDIA_BUCKET_NAME", "media")
ALLOWED_EXTENSIONS = {"jpg", "jpeg", "png", "gif"}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB


def validate_image(file: UploadFile) -> bool:
    """בדיקת תקינות תמונה"""
    # בדוק סוג קובץ
    ext = file.filename.split(".")[-1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"File type not allowed. Use: {', '.join(ALLOWED_EXTENSIONS)}"
        )
    
    # בדוק גודל (נעשה בעת העלאה)
    return True


async def save_upload_file(file: UploadFile) -> str:
    """שמירת תמונה ב-Supabase והחזרת public URL"""
    validate_image(file)
    
    # בדוק אם Supabase מוגדר
    if not supabase_client:
        raise HTTPException(
            status_code=500,
            detail="Cloud storage (Supabase) is not configured. Please set SUPABASE_URL and SUPABASE_KEY."
        )
    
    # קרא את תוכן הקובץ
    content = await file.read()
    
    # בדוק גודל
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"File too large. Max size: {MAX_FILE_SIZE / 1024 / 1024}MB"
        )
    
    # צור שם ייחודי
    file_ext = file.filename.split(".")[-1]
    unique_filename = f"{uuid.uuid4()}.{file_ext}"
    
    try:
        # Determine content type
        content_type_map = {
            "jpg": "image/jpeg",
            "jpeg": "image/jpeg",
            "png": "image/png",
            "gif": "image/gif"
        }
        content_type = content_type_map.get(file_ext, "application/octet-stream")
        
        # Upload to Supabase
        response = supabase_client.storage.from_(BUCKET_NAME).upload(
            path=unique_filename,
            file=content,
            file_options={"content-type": content_type}
        )
        
        # Build public URL
        public_url = f"{SUPABASE_URL}/storage/v1/object/public/{BUCKET_NAME}/{unique_filename}"
        logger.info(f"✅ Image uploaded to Supabase: {unique_filename}")
        
        return public_url
    
    except Exception as e:
        logger.error(f"❌ Failed to upload image to Supabase: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to upload image to cloud storage: {str(e)}"
        )


def delete_upload_file(file_url: str) -> bool:
    """
    מחיקת תמונה מ-Supabase.
    
    Args:
        file_url: Public URL של התמונה
    
    Returns:
        bool: True אם נמחקה בהצלחה, False אחרת
    """
    if not supabase_client:
        logger.warning("⚠️  Supabase not configured, cannot delete file")
        return False
    
    try:
        # Extract filename from URL
        filename = file_url.split('/')[-1]
        
        # Delete from Supabase
        supabase_client.storage.from_(BUCKET_NAME).remove([filename])
        logger.info(f"✅ Image deleted from Supabase: {filename}")
        return True
    except Exception as e:
        logger.error(f"❌ Failed to delete image from Supabase: {e}")
        return False
