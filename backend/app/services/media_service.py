import os
import uuid
from fastapi import UploadFile, HTTPException
from pathlib import Path

UPLOAD_DIR = Path("uploads")
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
    """שמירת קובץ והחזרת URL"""
    validate_image(file)
    
    # צור שם ייחודי
    file_ext = file.filename.split(".")[-1]
    unique_filename = f"{uuid.uuid4()}.{file_ext}"
    file_path = UPLOAD_DIR / unique_filename
    
    # שמור את הקובץ
    content = await file.read()
    
    # בדוק גודל
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"File too large. Max size: {MAX_FILE_SIZE / 1024 / 1024}MB"
        )
    
    with open(file_path, "wb") as f:
        f.write(content)
    
    # החזר URL
    return f"/uploads/{unique_filename}"


def delete_upload_file(filename: str) -> bool:
    """מחיקת קובץ"""
    file_path = UPLOAD_DIR / filename
    if file_path.exists():
        os.remove(file_path)
        return True
    return False