import pytest
from datetime import date


def test_create_weekly_note(client, auth_headers):
    """Test creating a weekly note with new foods"""
    response = client.post(
        "/api/v1/weekly",
        headers=auth_headers,
        json={
            "week_start_date": str(date.today()),
            "new_foods": [
                {
                    "food_name": "אבוקדו",
                    "difficulty_level": 2,
                    "notes": "טעים מאוד"
                }
            ]
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["week_start_date"] == str(date.today())
    assert len(data["new_foods"]) == 1
    assert data["new_foods"][0]["food_name"] == "אבוקדו"


def test_update_weekly_note(client, auth_headers):
    """Test updating existing weekly note"""
    today = str(date.today())
    
    # Create
    response = client.post(
        "/api/v1/weekly",
        headers=auth_headers,
        json={
            "week_start_date": today,
            "new_foods": [{"food_name": "בננה", "difficulty_level": 1}]
        }
    )
    note_id = response.json()["id"]
    
    # Update
    response = client.put(
        f"/api/v1/weekly/{note_id}",
        headers=auth_headers,
        json={
            "week_start_date": today,
            "new_foods": [
                {"food_name": "בננה", "difficulty_level": 1},
                {"food_name": "תפוח", "difficulty_level": 1}
            ]
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert len(data["new_foods"]) == 2


def test_get_weekly_notes(client, auth_headers):
    """Test retrieving weekly notes"""
    today = str(date.today())
    
    # Create a note
    client.post(
        "/api/v1/weekly",
        headers=auth_headers,
        json={
            "week_start_date": today,
            "new_foods": [{"food_name": "מלפפון", "difficulty_level": 1}]
        }
    )
    
    # Get notes
    response = client.get("/api/v1/weekly", headers=auth_headers)
    assert response.status_code == 200
    notes = response.json()
    assert len(notes) >= 1