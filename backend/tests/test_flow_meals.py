import pytest
from datetime import date


def test_meal_flow(client_user, db_session):
    """Test creating a meal, adding items to a plate, and fetching the daily log"""
    # Get today's date
    today = date.today().isoformat()
    
    # 1. Get meals for today (should create default meals)
    response = client_user.get(f"/api/v1/meals/?date={today}")
    assert response.status_code == 200
    meals = response.json()
    assert len(meals) == 3  # breakfast, lunch, dinner
    
    # Get the first meal (breakfast)
    breakfast = next(m for m in meals if m['meal_type'] == 'breakfast')
    meal_id = breakfast['id']
    
    # 2. Complete the meal with plate and hunger data
    complete_data = {
        "meal_id": meal_id,
        "free_plate_vegetables": 50,
        "free_plate_protein": 30,
        "free_plate_carbs": 20,
        "hunger_before": 7,
        "hunger_during": 5,
        "hunger_after": 3,
        "photo_url": None,
        "notes": "Test meal"
    }
    
    response = client_user.post("/api/v1/meals/complete", json=complete_data)
    assert response.status_code == 200
    completed_meal = response.json()
    
    # Verify free plate was created (there may be a default 'healthy' plate)
    free_plates = [p for p in completed_meal['plates'] if p.get('plate_type') == 'free']
    assert len(free_plates) == 1
    plate = free_plates[0]
    assert plate['vegetables_percent'] == 50
    assert plate['protein_percent'] == 30
    assert plate['carbs_percent'] == 20
    
    # Verify hunger logs were created
    assert len(completed_meal['hunger_logs']) == 3
    hunger_levels = [h['hunger_level'] for h in completed_meal['hunger_logs']]
    assert 7 in hunger_levels  # before
    assert 5 in hunger_levels  # during
    assert 3 in hunger_levels  # after
    
    # 3. Fetch the daily log again to verify
    response = client_user.get(f"/api/v1/meals/?date={today}")
    assert response.status_code == 200
    updated_meals = response.json()
    updated_breakfast = next(m for m in updated_meals if m['id'] == meal_id)
    # Ensure at least one free plate exists after update
    updated_free = [p for p in updated_breakfast['plates'] if p.get('plate_type') == 'free']
    assert len(updated_free) == 1
    assert len(updated_breakfast['hunger_logs']) == 3