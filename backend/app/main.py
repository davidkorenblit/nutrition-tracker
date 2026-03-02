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
from app.models.user import User  # 🆕
from app.models.nutritionist_recommendations import NutritionistRecommendations
from app.models.compliance import Compliance
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

app = FastAPI()

# ⚠️ CORS CONFIGURATION - ENVIRONMENT-AWARE
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")

# Detect environment: development if localhost/127.0.0.1 in URL, otherwise production
ENVIRON = "development" if ("localhost" in FRONTEND_URL or "127.0.0.1" in FRONTEND_URL) else "production"

# Build CORS origins list dynamically
CORS_ORIGINS = ["http://localhost:3000", "http://127.0.0.1:3000"]
if FRONTEND_URL and FRONTEND_URL not in CORS_ORIGINS:
    CORS_ORIGINS.append(FRONTEND_URL)

logger.info(f"🌐 CORS Origins configured: {CORS_ORIGINS}")
logger.info(f"🔧 Running in {ENVIRON.upper()} mode")

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
    return {"status": "healthy"}

@app.on_event("startup")
async def startup_tasks():
    # Environment & Configuration Verification
    supabase_configured = bool(os.getenv('SUPABASE_URL') and os.getenv('SUPABASE_KEY'))
    logger.info("=" * 60)
    logger.info("🚀 STARTUP VERIFICATION")
    logger.info("=" * 60)
    logger.info(f"📍 Environment: {ENVIRON.upper()}")
    logger.info(f"🌐 Frontend URL: {FRONTEND_URL}")
    logger.info(f"🔐 Database configured: {bool(os.getenv('DATABASE_URL'))}")
    logger.info(f"☁️  Supabase configured: {supabase_configured}")
    logger.info(f"📧 SMTP configured: {bool(os.getenv('SMTP_EMAIL'))}")
    logger.info(f"🔑 JWT Secret configured: {bool(os.getenv('SECRET_KEY'))}")
    logger.info("=" * 60)
    
    # create tables on startup to support cloud databases
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("✅ Database tables created/verified")
    except Exception as e:
        logger.error(f"❌ Error creating tables on startup: {e}")

    # ensure initial admin user
    from app.database import SessionLocal  # וודא שזה השם ב-database.py
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == "dycoren18@gmail.com").first()
        if user:
            user.is_admin = True
            db.commit()
            logger.info("✅ Admin status verified for dycoren18@gmail.com")
    except Exception as e:
        logger.error(f"❌ Admin update failed: {e}")
    finally:
        db.close()