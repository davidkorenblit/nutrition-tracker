import pytest
from datetime import date, timedelta


def test_run_compliance_check(client, auth_headers):
    """Test running a compliance check"""
    today = date.today()
    week_ago = today - timedelta(days=7)
    
    response = client.post(
        "/api/v1/compliance/check",
        headers=auth_headers,
        json={
            "period_start": str(week_ago),
            "period_end": str(today)
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert "overall_score" in data
    assert "water_intake_score" in data
    assert "new_foods_score" in data
    assert "recommendations_match_score" in data
    assert "healthy_plates_ratio_score" in data


def test_get_latest_compliance(client, auth_headers):
    """Test getting latest compliance check"""
    # First, run a check
    today = date.today()
    week_ago = today - timedelta(days=7)
    
    client.post(
        "/api/v1/compliance/check",
        headers=auth_headers,
        json={
            "period_start": str(week_ago),
            "period_end": str(today)
        }
    )
    
    # Get latest
    response = client.get("/api/v1/compliance/latest", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["period_start"] == str(week_ago)
    assert data["period_end"] == str(today)


def test_compliance_check_duplicate_period(client, auth_headers):
    """Test cannot create duplicate check for same period"""
    today = date.today()
    week_ago = today - timedelta(days=7)
    
    # First check
    client.post(
        "/api/v1/compliance/check",
        headers=auth_headers,
        json={
            "period_start": str(week_ago),
            "period_end": str(today)
        }
    )
    
    # Try again with same period
    response = client.post(
        "/api/v1/compliance/check",
        headers=auth_headers,
        json={
            "period_start": str(week_ago),
            "period_end": str(today)
        }
    )
    assert response.status_code == 409
    assert "already exists" in response.json()["detail"].lower()


def test_delete_compliance_check(client, auth_headers):
    """Test deleting a compliance check"""
    # Create a check
    today = date.today()
    week_ago = today - timedelta(days=7)
    
    response = client.post(
        "/api/v1/compliance/check",
        headers=auth_headers,
        json={
            "period_start": str(week_ago),
            "period_end": str(today)
        }
    )
    check_id = response.json()["id"]
    
    # Delete it
    response = client.delete(f"/api/v1/compliance/{check_id}", headers=auth_headers)
    assert response.status_code == 200
    
    # Verify deleted (should get 404)
    response = client.get("/api/v1/compliance/latest", headers=auth_headers)
    assert response.status_code == 404