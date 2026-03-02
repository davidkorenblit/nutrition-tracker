import os
import uuid
import re
import json
from pathlib import Path
from fastapi import UploadFile, HTTPException
from docx import Document
import google.generativeai as genai
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
        logger.info("✅ Supabase client initialized for file storage")
    except Exception as e:
        logger.warning(f"⚠️  Failed to initialize Supabase: {e}")

BUCKET_NAME = os.getenv("RECOMMENDATIONS_BUCKET_NAME", "recommendations")
ALLOWED_EXTENSIONS = {"docx"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB


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
    שמירת קובץ Word ב-Supabase והחזרת public URL.
    
    Args:
        file: קובץ Word להעלאה
    
    Returns:
        str: Public URL של הקובץ ב-Supabase
    
    Raises:
        HTTPException: אם הקובץ לא תקין או גדול מדי
    """
    validate_word_file(file)
    
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
        # Upload to Supabase
        response = supabase_client.storage.from_(BUCKET_NAME).upload(
            path=unique_filename,
            file=content,
            file_options={"content-type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document"}
        )
        
        # Build public URL
        public_url = f"{SUPABASE_URL}/storage/v1/object/public/{BUCKET_NAME}/{unique_filename}"
        logger.info(f"✅ File uploaded to Supabase: {unique_filename}")
        
        return public_url
    
    except Exception as e:
        logger.error(f"❌ Failed to upload to Supabase: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to upload file to cloud storage: {str(e)}"
        )


def parse_word_file(file_path: str) -> str:
    """
    חילוץ טקסט מקובץ Word מ-URL של Supabase.
    קורא גם פסקאות רגילות וגם תוכן של טבלאות.
    
    Args:
        file_path: Public URL של קובץ Word ב-Supabase
    
    Returns:
        str: הטקסט המלא מהקובץ
    
    Raises:
        HTTPException: אם הקריאה נכשלה
    """
    try:
        import requests
        from io import BytesIO
        
        # Download file from Supabase URL
        response = requests.get(file_path)
        response.raise_for_status()
        
        # Parse using python-docx
        doc = Document(BytesIO(response.content))
        full_text = []
        
        # חלץ טקסט מפסקאות רגילות
        for para in doc.paragraphs:
            if para.text.strip():  # רק אם יש טקסט
                full_text.append(para.text)
        
        # חלץ טקסט מטבלאות
        for table in doc.tables:
            for row in table.rows:
                for cell in row.cells:
                    if cell.text.strip():  # רק אם יש טקסט
                        full_text.append(cell.text)
        
        return '\n'.join(full_text)
        
    except Exception as e:
        logger.error(f"❌ Failed to parse Word file: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to parse Word file: {str(e)}"
        )


def extract_recommendations_with_llm(raw_text: str) -> list[dict]:
    """
    חילוץ המלצות מהטקסט באמצעות Gemini LLM.
    
    Args:
        raw_text: הטקסט המלא מקובץ Word
    
    Returns:
        list[dict]: רשימת המלצות בפורמט [{"id": 1, "text": "..."}, ...]
    
    Raises:
        HTTPException: אם הקריאה ל-LLM נכשלה
    """
    try:
        # הגדרת API key
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise HTTPException(
                status_code=500,
                detail="GEMINI_API_KEY not configured"
            )
        
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel('gemini-flash-latest')
        
        # בניית prompt
        prompt = f"""
אתה עוזר שמנתח מסמכי Word של תזונאים.
חלץ את כל ההמלצות מסעיף "המלצות לבית" בלבד.
החזר רשימת JSON בפורמט הבא בדיוק, ללא טקסט נוסף:
[{{"id": 1, "text": "טקסט ההמלצה הראשונה"}}, {{"id": 2, "text": "טקסט ההמלצה השנייה"}}]

חשוב:
- רק המלצות מהסעיף "המלצות לבית"
- כל המלצה כשורה נפרדת
- אל תוסיף הסברים או טקסט נוסף, רק JSON
- אם אין המלצות, החזר []

טקסט המסמך:
{raw_text}
"""
        
        # קריאה ל-LLM
        response = model.generate_content(prompt)
        response_text = response.text.strip()
        
        # ניקוי התגובה (הסרת markdown אם יש)
        response_text = re.sub(r'```json\s*', '', response_text)
        response_text = re.sub(r'```\s*', '', response_text)
        
        # המרה ל-JSON
        recommendations_list = json.loads(response_text)
        
        # הוסף שדות ברירת מחדל לכל המלצה
        for rec in recommendations_list:
            rec["category"] = "general"
            rec["tracked"] = False
            rec["target_value"] = None
            rec["notes"] = None
        
        return recommendations_list
        
    except json.JSONDecodeError as e:
        logger.error(f"❌ Failed to parse LLM response as JSON: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to parse LLM response as JSON: {str(e)}"
        )
    except Exception as e:
        logger.error(f"❌ Failed to extract recommendations with LLM: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to extract recommendations with LLM: {str(e)}"
        )


def delete_word_file(file_url: str) -> bool:
    """
    מחיקת קובץ Word מ-Supabase.
    
    Args:
        file_url: Public URL של הקובץ
    
    Returns:
        bool: True אם נמחק בהצלחה, False אחרת
    """
    if not supabase_client:
        logger.warning("⚠️  Supabase not configured, cannot delete file")
        return False
    
    try:
        # Extract filename from URL
        filename = file_url.split('/')[-1]
        
        # Delete from Supabase
        supabase_client.storage.from_(BUCKET_NAME).remove([filename])
        logger.info(f"✅ File deleted from Supabase: {filename}")
        return True
    except Exception as e:
        logger.error(f"❌ Failed to delete file from Supabase: {e}")
        return False



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
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    with open(file_path, "wb") as f:
        f.write(content)
    
    return str(file_path)


def parse_word_file(file_path: str) -> str:
    """
    חילוץ טקסט מקובץ Word באמצעות python-docx.
    קורא גם פסקאות רגילות וגם תוכן של טבלאות.
    
    Args:
        file_path: נתיב לקובץ Word
    
    Returns:
        str: הטקסט המלא מהקובץ
    
    Raises:
        HTTPException: אם הקריאה נכשלה
    """
    try:
        doc = Document(file_path)
        full_text = []
        
        # חלץ טקסט מפסקאות רגילות
        for para in doc.paragraphs:
            if para.text.strip():  # רק אם יש טקסט
                full_text.append(para.text)
        
        # חלץ טקסט מטבלאות
        for table in doc.tables:
            for row in table.rows:
                for cell in row.cells:
                    if cell.text.strip():  # רק אם יש טקסט
                        full_text.append(cell.text)
        
        return '\n'.join(full_text)
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to parse Word file: {str(e)}"
        )


def extract_recommendations_with_llm(raw_text: str) -> list[dict]:
    """
    חילוץ המלצות מהטקסט באמצעות Gemini LLM.
    
    Args:
        raw_text: הטקסט המלא מקובץ Word
    
    Returns:
        list[dict]: רשימת המלצות בפורמט [{"id": 1, "text": "..."}, ...]
    
    Raises:
        HTTPException: אם הקריאה ל-LLM נכשלה
    """
    try:
        # הגדרת API key
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise HTTPException(
                status_code=500,
                detail="GEMINI_API_KEY not configured"
            )
        
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel('gemini-flash-latest')
        
        # בניית prompt
        prompt = f"""
אתה עוזר שמנתח מסמכי Word של תזונאים.
חלץ את כל ההמלצות מסעיף "המלצות לבית" בלבד.
החזר רשימת JSON בפורמט הבא בדיוק, ללא טקסט נוסף:
[{{"id": 1, "text": "טקסט ההמלצה הראשונה"}}, {{"id": 2, "text": "טקסט ההמלצה השנייה"}}]

חשוב:
- רק המלצות מהסעיף "המלצות לבית"
- כל המלצה כשורה נפרדת
- אל תוסיף הסברים או טקסט נוסף, רק JSON
- אם אין המלצות, החזר []

טקסט המסמך:
{raw_text}
"""
        
        # קריאה ל-LLM
        response = model.generate_content(prompt)
        response_text = response.text.strip()
        
        # ניקוי התגובה (הסרת markdown אם יש)
        response_text = re.sub(r'```json\s*', '', response_text)
        response_text = re.sub(r'```\s*', '', response_text)
        
        # המרה ל-JSON
        recommendations_list = json.loads(response_text)
        
        # הוסף שדות ברירת מחדל לכל המלצה
        for rec in recommendations_list:
            rec["category"] = "general"
            rec["tracked"] = False
            rec["target_value"] = None
            rec["notes"] = None
        
        return recommendations_list
        
    except json.JSONDecodeError as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to parse LLM response as JSON: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to extract recommendations with LLM: {str(e)}"
        )


def delete_word_file(file_path: str) -> bool:
    """מחיקת קובץ Word"""
    try:
        if os.path.exists(file_path):
            os.remove(file_path)
            return True
        return False
    except Exception:
        return False