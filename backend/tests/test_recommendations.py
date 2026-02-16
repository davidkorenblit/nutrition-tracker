import pytest
from datetime import date


def test_create_recommendations_manual(client, auth_headers, db_session, test_user):
    """Test creating recommendations by inserting directly to DB and retrieving via API"""
    from app.models.nutritionist_recommendations import NutritionistRecommendations
    recs = [
        {"id": 1, "text": "לשתות 2 ליטר מים ביום", "category": "quantity", "tracked": True, "target_value": 2000.0, "notes": None},
        {"id": 2, "text": "להוסיף ירקות ירוקים", "category": "new_food", "tracked": False, "target_value": None, "notes": None}
    ]
    new = NutritionistRecommendations(
        user_id=test_user.id,
        visit_date=str(date.today()),
        file_path="manual",
        raw_text="",
        recommendations=recs
    )
    db_session.add(new)
    db_session.commit()
    db_session.refresh(new)

    # Retrieve via API
    response = client.get("/api/v1/recommendations", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert any(r['id'] == new.id for r in data) or len(data) >= 1


def test_get_all_recommendations(client, auth_headers, db_session, test_user):
    """Test retrieving all recommendations"""
    from app.models.nutritionist_recommendations import NutritionistRecommendations
    new = NutritionistRecommendations(
        user_id=test_user.id,
        visit_date=str(date.today()),
        file_path="manual",
        raw_text="",
        recommendations=[{"id": 1, "text": "המלצה 1", "category": "general"}]
    )
    db_session.add(new)
    db_session.commit()

    # Get all
    response = client.get("/api/v1/recommendations", headers=auth_headers)
    assert response.status_code == 200
    recs = response.json()
    assert len(recs) >= 1


def test_delete_recommendations(client, auth_headers, db_session, test_user):
    """Test deleting recommendations"""
    from app.models.nutritionist_recommendations import NutritionistRecommendations
    new = NutritionistRecommendations(
        user_id=test_user.id,
        visit_date=str(date.today()),
        file_path="manual",
        raw_text="",
        recommendations=[{"id": 1, "text": "test", "category": "general"}]
    )
    db_session.add(new)
    db_session.commit()
    db_session.refresh(new)
    rec_id = new.id

    # Delete via API
    response = client.delete(f"/api/v1/recommendations/{rec_id}", headers=auth_headers)
    assert response.status_code == 200

    # Verify deleted
    response = client.get("/api/v1/recommendations", headers=auth_headers)
    remaining = response.json()
    assert not any(r["id"] == rec_id for r in remaining)