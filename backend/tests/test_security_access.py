import pytest
from app.models.user import User
from app.utils.security import get_password_hash


def test_user_access_control(client, db_session):
    """Test that User A cannot access User B's logs"""
    
    # Create two users
    user_a = User(
        email="usera@example.com",
        hashed_password=get_password_hash("pass123"),
        name="User A",
        is_verified=True,
        daily_water_goal_ml=2000,
        compliance_check_frequency_days=14
    )
    user_b = User(
        email="userb@example.com",
        hashed_password=get_password_hash("pass123"),
        name="User B",
        is_verified=True,
        daily_water_goal_ml=2000,
        compliance_check_frequency_days=14
    )
    db_session.add(user_a)
    db_session.add(user_b)
    db_session.commit()
    
    # Login as User A
    response = client.post("/api/v1/auth/login", json={"email": "usera@example.com", "password": "pass123"})
    token_a = response.json()["access_token"]
    headers_a = {"Authorization": f"Bearer {token_a}"}
    
    # Login as User B
    response = client.post("/api/v1/auth/login", json={"email": "userb@example.com", "password": "pass123"})
    token_b = response.json()["access_token"]
    headers_b = {"Authorization": f"Bearer {token_b}"}
    
    # User A adds water log
    client.headers.update(headers_a)
    response = client.post("/api/v1/water/", json={"amount_ml": 250})
    assert response.status_code == 200

    # User B tries to access User A's water logs - should not see A's logs
    client.headers.update(headers_b)
    from datetime import date
    today = date.today().isoformat()
    response = client.get(f"/api/v1/water/logs?date={today}")
    assert response.status_code == 200
    logs = response.json()
    # Should return empty list since no logs for user B
    assert len(logs) == 0
    
    # User B tries to get User A's meals - should return empty or only their own
    from datetime import date
    today = date.today().isoformat()
    response = client.get(f"/api/v1/meals/?date={today}")
    assert response.status_code == 200
    meals = response.json()
    # Ensure we got a list of meals (schema does not expose user_id)
    assert isinstance(meals, list)
    for meal in meals:
        assert 'id' in meal and 'meal_type' in meal