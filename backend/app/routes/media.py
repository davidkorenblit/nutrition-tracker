from fastapi import APIRouter, UploadFile, File
from app.services.media_service import save_upload_file

router = APIRouter(
    prefix="/api/v1/media",
    tags=["media"]
)

@router.post("/upload")
async def upload_image(file: UploadFile = File(...)):
    """
    העלאת תמונה
    
    Returns:
        {"url": "/uploads/xxxxx.jpg"}
    """
    url = await save_upload_file(file)
    return {"url": url}