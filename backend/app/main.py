from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
import os
import logging
from app.database import engine, Base
from app.models.meal import Meal
from app.models.plate import Plate
from app.models.hunger_log import HungerLog
from app.models.snack import Snack
from app.models.weekly_notes import WeeklyNotes
from app.models.user import User
from app.models.nutritionist_recommendations import NutritionistRecommendations
from app.models.compliance import Compliance
from app.models.water_log import WaterLog  # ✅ Must be imported so create_all builds the table
from app.routes import meals, snacks, plates, hunger, weekly, media, recommendations, compliance, auth
from app.utils.exceptions import ValidationError, NotFoundError, FileUploadError, DuplicateError
from app.routes import water


# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# metadata creation moved to startup event for cloud DB compatibility

from sqlalchemy import text as sa_text

# Detect environment early for docs config
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")
_docs_url = "/docs" if ENVIRONMENT != "production" else None
_redoc_url = "/redoc" if ENVIRONMENT != "production" else None

app = FastAPI(
    title="DailyBite Nutrition Tracker API",
    version="1.0.0",
    description="Backend API for the DailyBite nutritionist-client platform.",
    docs_url=_docs_url,
    redoc_url=_redoc_url,
)

# ⚠️ CORS CONFIGURATION - ENVIRONMENT-AWARE
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")

# Build CORS origins: support comma-separated OR ' || '-separated list of URLs
CORS_ORIGINS = ["http://localhost:3000", "http://127.0.0.1:3000"]

# Handle both comma and ' || ' separators
if " || " in FRONTEND_URL:
    url_list = FRONTEND_URL.split(" || ")
else:
    url_list = FRONTEND_URL.split(",")

for _url in url_list:
    _url = _url.strip()
    if _url and _url not in CORS_ORIGINS:
        CORS_ORIGINS.append(_url)

# Detect environment from the final origin list
ENVIRON = "development" if any("localhost" in u or "127.0.0.1" in u for u in CORS_ORIGINS) else "production"




app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
    # Log the full traceback for debugging
    logger.error(f"Unhandled exception: {type(exc).__name__}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"error": "Internal Server Error", "message": str(exc)}
    )

# Static Files - Moved to Cloud Storage (Supabase)
# app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Routers
app.include_router(meals.router)
app.include_router(snacks.router)
app.include_router(plates.router)
app.include_router(hunger.router)
app.include_router(weekly.router)
app.include_router(media.router)
app.include_router(recommendations.router)
app.include_router(compliance.router)
app.include_router(auth.router) 
app.include_router(water.router)



@app.get("/")
def read_root():
    return {"message": "Nutrition Tracker API is running"}

@app.get("/health")
def health_check():
    """Liveness probe — also validates DB connectivity for Azure health check."""
    from app.database import SessionLocal
    try:
        db = SessionLocal()
        db.execute(sa_text("SELECT 1"))
        db.close()
        return {"status": "healthy", "database": "connected"}
    except Exception as e:
        logger.error(f"Health check DB failure: {e}")
        from fastapi.responses import JSONResponse
        return JSONResponse(
            status_code=503,
            content={"status": "unhealthy", "database": "unreachable", "detail": str(e)}
        )

@app.on_event("startup")
async def startup_tasks():
    # Create tables
    try:
        Base.metadata.create_all(bind=engine)
    except Exception as e:
        logger.error(f"Error creating tables on startup: {e}")

    # Ensure admin role
    from app.database import SessionLocal
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == "dycoren18@gmail.com").first()
        if user and user.role != "admin":
            user.role = "admin"
            db.commit()
    except Exception as e:
        logger.error(f"Admin seed failed: {e}")
    finally:
        db.close()