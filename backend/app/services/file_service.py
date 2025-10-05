import os
import uuid
import re
from pathlib import Path
from fastapi import UploadFile, HTTPException
import mammoth

UPLOAD_DIR = Path("uploads/recommendations")
ALLOWED_EXTENSIONS = {"docx"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB

# יצירת תיקייה אם לא קיימת
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


def validate_word_file(file: UploadFile) -> bool:
    """בדיקת תקינות קובץ Word"""
    ext = file.filename.split(".")[-1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"File type not allowed. Use: {', '.join(ALLOWED_EXTENSIONS)}"
        )
    return True


async def save_word_file(file: UploadFile) -> str:
    """
    שמירת קובץ Word והחזרת נתיב.
    
    Args:
        file: קובץ Word להעלאה
    
    Returns:
        str: נתיב הקובץ השמור
    
    Raises:
        HTTPException: אם הקובץ לא תקין או גדול מדי
    """
    validate_word_file(file)
    
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
    
    return str(file_path)


def parse_word_file(file_path: str) -> str:
    """
    חילוץ טקסט מקובץ Word באמצעות mammoth.
    
    Args:
        file_path: נתיב לקובץ Word
    
    Returns:
        str: הטקסט המלא מהקובץ
    
    Raises:
        HTTPException: אם הקריאה נכשלה
    """
    try:
        with open(file_path, "rb") as docx_file:
            result = mammoth.extract_raw_text(docx_file)
            return result.value
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to parse Word file: {str(e)}"
        )


def extract_recommendations_section(text: str) -> str:
    """
    חילוץ סעיף 'המלצות לבית' מהטקסט.
    
    Args:
        text: טקסט מלא מהקובץ
    
    Returns:
        str: רק סעיף ההמלצות
    """
    # חיפוש סעיף "המלצות לבית" (עם וריאציות)
    patterns = [
        r"המלצות לבית[:\s]+(.*?)(?=\n\n|הערות:|$)",
        r"המלצות[:\s]+(.*?)(?=\n\n|הערות:|$)",
    ]
    
    for pattern in patterns:
        match = re.search(pattern, text, re.DOTALL | re.IGNORECASE)
        if match:
            return match.group(1).strip()
    
    # אם לא נמצא סעיף ספציפי, החזר את כל הטקסט
    return text.strip()


def parse_recommendations_to_list(recommendations_text: str) -> list[dict]:
    """
    המרת טקסט המלצות לרשימת dict.
    כל שורה שמתחילה במספר = המלצה.
    
    Args:
        recommendations_text: טקסט ההמלצות
    
    Returns:
        list[dict]: רשימת המלצות
    """
    lines = recommendations_text.split('\n')
    recommendations = []
    item_id = 1
    
    for line in lines:
        line = line.strip()
        # בדוק אם השורה מתחילה במספר (1. 2. 3. וכו')
        if re.match(r'^\d+\.', line):
            # הסר את המספר מתחילת השורה
            text = re.sub(r'^\d+\.\s*', '', line)
            if text:  # רק אם יש טקסט
                recommendations.append({
                    "id": item_id,
                    "text": text,
                    "category": "general",  # ברירת מחדל
                    "tracked": False,
                    "target_value": None,
                    "notes": None
                })
                item_id += 1
    
    return recommendations


def delete_word_file(file_path: str) -> bool:
    """מחיקת קובץ Word"""
    try:
        if os.path.exists(file_path):
            os.remove(file_path)
            return True
        return False
    except Exception:
        return False