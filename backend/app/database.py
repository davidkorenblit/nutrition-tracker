import os
from sqlalchemy import create_engine, event, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
import logging
from dotenv import load_dotenv

logger = logging.getLogger(__name__)

# Load environment variables from .env file
load_dotenv()

# prioritize DATABASE_URL environment variable; fall back to local sqlite for development
DATABASE_URL = os.getenv("DATABASE_URL")
if DATABASE_URL:
    # Strip leading/trailing whitespace (common env-file formatting bug)
    DATABASE_URL = DATABASE_URL.strip()
    # SQLAlchemy 1.4+ requires postgres:// --> postgresql://
    if DATABASE_URL.startswith("postgres://"):
        DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)
    SQLALCHEMY_DATABASE_URL = DATABASE_URL
    logger.info(f"Using remote database: {SQLALCHEMY_DATABASE_URL[:50]}...")
else:
    SQLALCHEMY_DATABASE_URL = "sqlite:///./nutrition_tracker.db"
    logger.info(f"Using local SQLite database: {SQLALCHEMY_DATABASE_URL}")

# engine creation arguments differ for sqlite
engine_kwargs = {}
if SQLALCHEMY_DATABASE_URL.startswith("sqlite"):
    engine_kwargs["connect_args"] = {"check_same_thread": False}
    engine_kwargs["poolclass"] = StaticPool
else:
    # pool_pre_ping validates connections before use — prevents stale-connection
    # errors with Azure PostgreSQL / Supabase PgBouncer (port 6543)
    engine_kwargs["pool_pre_ping"] = True
    engine_kwargs["pool_size"] = 5
    engine_kwargs["max_overflow"] = 10

try:
    engine = create_engine(SQLALCHEMY_DATABASE_URL, **engine_kwargs)
    logger.info("Database engine created successfully")
except Exception as e:
    logger.error(f"Failed to create database engine: {str(e)}", exc_info=True)
    raise

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    """Get database session with comprehensive error handling"""
    db = SessionLocal()
    try:
        db.execute(text("SELECT 1"))
        logger.debug("Database connection successful")
        yield db
    except Exception as e:
        logger.error(f"Database connection error: {str(e)}", exc_info=True)
        raise
    finally:
        db.close()  # only here — not in except