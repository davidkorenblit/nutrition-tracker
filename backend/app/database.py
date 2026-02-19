import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# prioritize DATABASE_URL environment variable; fall back to local sqlite for development
DATABASE_URL = os.getenv("DATABASE_URL")
if DATABASE_URL:
    # sqlachemy 1.4+ requires postgres:// --> postgresql://
    if DATABASE_URL.startswith("postgres://"):
        DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)
    SQLALCHEMY_DATABASE_URL = DATABASE_URL
else:
    SQLALCHEMY_DATABASE_URL = "sqlite:///./nutrition_tracker.db"

# engine creation arguments differ for sqlite
engine_kwargs = {}
if SQLALCHEMY_DATABASE_URL.startswith("sqlite"):
    engine_kwargs["connect_args"] = {"check_same_thread": False}

engine = create_engine(SQLALCHEMY_DATABASE_URL, **engine_kwargs)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()