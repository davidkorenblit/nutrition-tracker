import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from app.database import Base, get_db
from app.main import app
from app.models.user import User
from app.models.meal import Meal
from app.models.plate import Plate
from app.models.hunger_log import HungerLog
from app.models.snack import Snack
from app.models.weekly_notes import WeeklyNotes
from app.models.nutritionist_recommendations import NutritionistRecommendations
from app.models.compliance import Compliance
from app.models.water_log import WaterLog
from app.models.verification_code import VerificationCode
from app.utils.security import get_password_hash
import unittest.mock

# Test database
SQLALCHEMY_TEST_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(
    SQLALCHEMY_TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="function")
def db_session():
    """Create a fresh database for each test"""
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def client(db_session):
    """Create a test client with overridden database"""
    def override_get_db():
        try:
            yield db_session
        finally:
            pass
    
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def test_user(db_session):
    """Create a test user"""
    user = User(
        email="test@example.com",
        hashed_password=get_password_hash("testpass123"),
        name="Test User",
        is_verified=True,
        daily_water_goal_ml=2000,
        compliance_check_frequency_days=14
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def auth_headers(client, test_user):
    """Get authentication headers for test user"""
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "test@example.com", "password": "testpass123"}
    )
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def mock_gemini():
    """Mock Google Gemini API calls"""
    mock_response = unittest.mock.MagicMock()
    mock_response.text = '[{"id": 1, "text": "Drink more water"}, {"id": 2, "text": "Eat more vegetables"}]'
    mock_model = unittest.mock.MagicMock()
    mock_model.generate_content.return_value = mock_response
    
    with unittest.mock.patch('google.generativeai.GenerativeModel', return_value=mock_model) as mock_genai:
        yield mock_genai


@pytest.fixture
def client_user(client, auth_headers):
    """Create an authorized test client with JWT token"""
    client.headers.update(auth_headers)
    return client