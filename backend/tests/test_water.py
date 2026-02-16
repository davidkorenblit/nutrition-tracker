import pytest
from datetime import date


def test_log_water(client, auth_headers):
    """Test logging water intake"""
    response = client.post(
        "/api/v1/water/",
        headers=auth_headers,
        json={"amount_ml": 500}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["amount_ml"] == 500
    assert "id" in data


def test_get_water_logs_today(client, auth_headers):
    """Test retrieving today's water logs"""
    # Log some water
    client.post("/api/v1/water/", headers=auth_headers, json={"amount_ml": 250})
    client.post("/api/v1/water/", headers=auth_headers, json={"amount_ml": 350})

    # Get today's logs
    today = str(date.today())
    response = client.get(f"/api/v1/water/logs?date={today}", headers=auth_headers)
    assert response.status_code == 200
    logs = response.json()
    assert len(logs) == 2
    total = sum(log["amount_ml"] for log in logs)
    assert total == 600


def test_water_negative_amount(client, auth_headers):
    """Test cannot log negative water amount"""
    response = client.post(
        "/api/v1/water/",
        headers=auth_headers,
        json={"amount_ml": -100}
    )
    assert response.status_code == 422  # Validation error