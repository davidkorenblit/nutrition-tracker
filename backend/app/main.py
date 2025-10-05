from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from fastapi.staticfiles import StaticFiles
from app.database import engine, Base
from app.models.meal import Meal
from app.models.plate import Plate
from app.models.hunger_log import HungerLog
from app.models.snack import Snack
from app.models.weekly_notes import WeeklyNotes
from app.models.user import User  # 🆕
from app.models.nutritionist_recommendations import NutritionistRecommendations
from app.models.compliance import Compliance
from app.routes import meals, snacks, plates, hunger, weekly, media, recommendations, compliance, auth
from app.utils.exceptions import ValidationError, NotFoundError, FileUploadError, DuplicateError

Base.metadata.create_all(bind=engine)

app = FastAPI()

# Exception Handlers
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """
    Custom handler for Pydantic validation errors.
    Converts validation errors to JSON-serializable format.
    """
    # Convert errors to JSON-safe format
    errors = []
    for error in exc.errors():
        error_dict = {
            "loc": error.get("loc"),
            "msg": error.get("msg"),
            "type": error.get("type")
        }
        # Add input if available
        if "input" in error:
            error_dict["input"] = error.get("input")
        
        errors.append(error_dict)
    
    return JSONResponse(
        status_code=422,
        content={"error": "Validation Error", "details": errors}
    )

@app.exception_handler(ValidationError)
async def custom_validation_handler(request: Request, exc: ValidationError):
    return JSONResponse(status_code=400, content={"error": exc.message})

@app.exception_handler(NotFoundError)
async def not_found_handler(request: Request, exc: NotFoundError):
    return JSONResponse(status_code=404, content={"error": exc.message})

@app.exception_handler(FileUploadError)
async def file_upload_handler(request: Request, exc: FileUploadError):
    return JSONResponse(status_code=400, content={"error": exc.message})

@app.exception_handler(DuplicateError)
async def duplicate_handler(request: Request, exc: DuplicateError):
    return JSONResponse(status_code=409, content={"error": exc.message})

@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"error": "Internal Server Error", "message": str(exc)}
    )

# Static Files
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Routers
app.include_router(meals.router)
app.include_router(snacks.router)
app.include_router(plates.router)
app.include_router(hunger.router)
app.include_router(weekly.router)
app.include_router(media.router)
app.include_router(recommendations.router)
app.include_router(compliance.router)
app.include_router(auth.router)  # 🆕

@app.get("/")
def read_root():
    return {"message": "Nutrition Tracker API is running"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}