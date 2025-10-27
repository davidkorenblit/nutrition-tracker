import pytest
from datetime import date


def test_create_recommendations_manual(client, auth_headers):
    """Test creating recommendations manually (without file)"""
    response = client.post(
        "/api/v1/recommendations/manual",
        headers=auth_headers,
        json={
            "visit_date": str(date.today()),
            "recommendations": [
                {
                    "id": 1,
                    "text": "לשתות 2 ליטר מים ביום",
                    "category": "hydration",
                    "tracked": True,
                    "target_value": "2000ml",
                    "notes": None
                },
                {
                    "id": 2,
                    "text": "להוסיף ירקות ירוקים",
                    "category": "vegetables",
                    "tracked": False,
                    "target_value": None,
                    "notes": None
                }
            ]
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["visit_date"] == str(date.today())
    assert len(data["recommendations"]) == 2


def test_get_all_recommendations(client, auth_headers):
    """Test retrieving all recommendations"""
    # Create a recommendation
    client.post(
        "/api/v1/recommendations/manual",
        headers=auth_headers,
        json={
            "visit_date": str(date.today()),
            "recommendations": [
                {"id": 1, "text": "המלצה 1", "category": "general"}
            ]
        }
    )
    
    # Get all
    response = client.get("/api/v1/recommendations", headers=auth_headers)
    assert response.status_code == 200
    recs = response.json()
    assert len(recs) >= 1


def test_delete_recommendations(client, auth_headers):
    """Test deleting recommendations"""
    # Create
    response = client.post(
        "/api/v1/recommendations/manual",
        headers=auth_headers,
        json={
            "visit_date": str(date.today()),
            "recommendations": [{"id": 1, "text": "test", "category": "general"}]
        }
    )
    rec_id = response.json()["id"]
    
    # Delete
    response = client.delete(f"/api/v1/recommendations/{rec_id}", headers=auth_headers)
    assert response.status_code == 200
    
    # Verify deleted
    response = client.get("/api/v1/recommendations", headers=auth_headers)
    remaining = response.json()
    assert not any(r["id"] == rec_id for r in remaining)