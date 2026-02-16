import pytest
from datetime import date


def test_water_flow(client_user, db_session):
    """Test adding water entries and checking daily aggregation"""
    today = date.today()
    
    # 1. Add multiple water entries
    water_amounts = [250, 300, 200]  # ml
    
    created_logs = []
    for amount in water_amounts:
        response = client_user.post("/api/v1/water/", json={"amount_ml": amount})
        assert response.status_code == 200
        log = response.json()
        created_logs.append(log)
        assert log['amount_ml'] == amount
    
    # 2. Get logs for today
    response = client_user.get(f"/api/v1/water/logs?date={today.isoformat()}")
    assert response.status_code == 200
    logs = response.json()
    assert len(logs) == 3
    
    total_from_logs = sum(log['amount_ml'] for log in logs)
    assert total_from_logs == 750
    
    # 3. Get total water for today
    response = client_user.get(f"/api/v1/water/total?date={today.isoformat()}")
    assert response.status_code == 200
    total_data = response.json()
    assert total_data['total_ml'] == 750