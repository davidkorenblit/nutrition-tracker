import pytest
from datetime import date


def test_create_meal(client, auth_headers):
    """Test creating a new meal"""
    response = client.post(
        "/api/v1/meals",
        headers=auth_headers,
        json={
            "meal_type": "breakfast",
            "date": str(date.today()),
            "plates": [
                {
                    "plate_type": "healthy",
                    "vegetables_percent": 50,
                    "protein_percent": 30,
                    "carbs_percent": 20
                }
            ]
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["meal_type"] == "breakfast"
    assert len(data["plates"]) == 1
    assert data["plates"][0]["plate_type"] == "healthy"


def test_healthy_plate_validation(client, auth_headers):
    """Test healthy plate must sum to 100%"""
    response = client.post(
        "/api/v1/meals",
        headers=auth_headers,
        json={
            "meal_type": "lunch",
            "date": str(date.today()),
            "plates": [
                {
                    "plate_type": "healthy",
                    "vegetables_percent": 50,
                    "protein_percent": 30,
                    "carbs_percent": 15  # Wrong! Should be 20
                }
            ]
        }
    )
    assert response.status_code == 400
    assert "must sum to 100" in response.json()["detail"].lower()


def test_get_meals_by_date(client, auth_headers):
    """Test retrieving meals by date"""
    today = str(date.today())
    
    # Create a meal
    client.post(
        "/api/v1/meals",
        headers=auth_headers,
        json={
            "meal_type": "dinner",
            "date": today,
            "plates": [
                {
                    "plate_type": "free",
                    "vegetables_percent": 30,
                    "protein_percent": 40,
                    "carbs_percent": 30
                }
            ]
        }
    )
    
    # Get meals for today
    response = client.get(f"/api/v1/meals?date={today}", headers=auth_headers)
    assert response.status_code == 200
    meals = response.json()
    assert len(meals) >= 1
    assert meals[0]["meal_type"] == "dinner"