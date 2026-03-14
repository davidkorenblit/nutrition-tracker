"""
E2E Test: Full user lifecycle flow
Registration → Email verification bypass (test mode) → Login → Dashboard data
"""
import pytest
from datetime import date


TODAY = date.today().isoformat()


# ─────────────────────────────────────────────
# FLOW 1: Registration → Login → Dashboard
# ─────────────────────────────────────────────

class TestFullUserFlow:
    """Complete user journey from signup to viewing dashboard data."""

    def test_01_register(self, client):
        """Step 1: Register a new user."""
        resp = client.post("/api/v1/auth/register", json={
            "email": "e2e_user@example.com",
            "password": "E2eTest1!",
            "name": "E2E User"
        })
        assert resp.status_code == 201, resp.text
        data = resp.json()
        assert data["email"] == "e2e_user@example.com"
        assert data["name"] == "E2E User"
        assert "id" in data

    def test_02_duplicate_registration_rejected(self, client, test_user):
        """Step 2: Registering the same email twice returns 400."""
        resp = client.post("/api/v1/auth/register", json={
            "email": "test@example.com",  # same as test_user fixture
            "password": "E2eTest1!",
            "name": "Duplicate"
        })
        assert resp.status_code in (400, 409), resp.text

    def test_03_unverified_user_cannot_login(self, client):
        """Step 3: A freshly registered (unverified) user cannot log in."""
        # Register without verifying
        client.post("/api/v1/auth/register", json={
            "email": "unverified@example.com",
            "password": "E2eTest1!",
            "name": "Unverified"
        })
        resp = client.post("/api/v1/auth/login", json={
            "email": "unverified@example.com",
            "password": "E2eTest1!"
        })
        # Should be 403 (not verified) — not 200
        assert resp.status_code in (400, 403), resp.text

    def test_04_verified_user_login(self, client, test_user, auth_headers):
        """Step 4: Verified user logs in and receives a JWT token."""
        # auth_headers fixture already logs in test_user
        assert "Authorization" in auth_headers
        assert auth_headers["Authorization"].startswith("Bearer ")

    def test_05_get_profile(self, client, auth_headers):
        """Step 5: Authenticated user can fetch their own profile."""
        resp = client.get("/api/v1/auth/me", headers=auth_headers)
        assert resp.status_code == 200, resp.text
        data = resp.json()
        assert data["email"] == "test@example.com"
        assert data["name"] == "Test User"

    def test_06_meals_created_for_today(self, client, auth_headers):
        """Step 6: Fetching meals for today auto-creates breakfast/lunch/dinner."""
        resp = client.get(f"/api/v1/meals/?date={TODAY}", headers=auth_headers)
        assert resp.status_code == 200, resp.text
        meals = resp.json()
        assert len(meals) == 3
        meal_types = {m["meal_type"] for m in meals}
        assert meal_types == {"breakfast", "lunch", "dinner"}

    def test_07_add_snack(self, client, auth_headers):
        """Step 7: User can log a snack for today."""
        resp = client.post("/api/v1/snacks/", json={
            "date": TODAY,
            "description": "Apple"
        }, headers=auth_headers)
        assert resp.status_code == 200, resp.text
        data = resp.json()
        assert data["description"] == "Apple"
        assert data["date"] == TODAY

    def test_08_fetch_snacks(self, client, auth_headers):
        """Step 8: After adding a snack, it appears in the snack list."""
        # Add snack
        client.post("/api/v1/snacks/", json={
            "date": TODAY,
            "description": "Banana"
        }, headers=auth_headers)

        resp = client.get(f"/api/v1/snacks/?date={TODAY}", headers=auth_headers)
        assert resp.status_code == 200, resp.text
        snacks = resp.json()
        assert any(s["description"] == "Banana" for s in snacks)

    def test_09_delete_snack(self, client, auth_headers):
        """Step 9: User can delete a snack."""
        # Create
        create_resp = client.post("/api/v1/snacks/", json={
            "date": TODAY,
            "description": "To Delete"
        }, headers=auth_headers)
        snack_id = create_resp.json()["id"]

        # Delete
        del_resp = client.delete(f"/api/v1/snacks/{snack_id}", headers=auth_headers)
        assert del_resp.status_code == 200, del_resp.text

        # Verify gone
        list_resp = client.get(f"/api/v1/snacks/?date={TODAY}", headers=auth_headers)
        ids = [s["id"] for s in list_resp.json()]
        assert snack_id not in ids

    def test_10_log_water_and_fetch_total(self, client, auth_headers):
        """Step 10: User can log water and the total is returned correctly."""
        client.post("/api/v1/water/", json={"amount_ml": 300}, headers=auth_headers)
        client.post("/api/v1/water/", json={"amount_ml": 500}, headers=auth_headers)

        resp = client.get(f"/api/v1/water/total?date={TODAY}", headers=auth_headers)
        assert resp.status_code == 200, resp.text
        assert resp.json()["total_ml"] >= 800

    def test_11_complete_meal(self, client, auth_headers):
        """Step 11: User completes a meal (adds plate + hunger logs)."""
        # Get meal id for breakfast
        meals_resp = client.get(f"/api/v1/meals/?date={TODAY}", headers=auth_headers)
        meals = meals_resp.json()
        breakfast = next(m for m in meals if m["meal_type"] == "breakfast")
        meal_id = breakfast["id"]

        resp = client.post("/api/v1/meals/complete", json={
            "meal_id": meal_id,
            "free_plate_vegetables": 50,
            "free_plate_protein": 30,
            "free_plate_carbs": 20,
            "hunger_before": 7,
            "hunger_during": 5,
            "hunger_after": 3
        }, headers=auth_headers)
        assert resp.status_code == 200, resp.text
        data = resp.json()
        assert len(data["plates"]) >= 1
        assert len(data["hunger_logs"]) == 3

    def test_12_unauthenticated_request_rejected(self, client):
        """Step 12: Requests without a token are rejected with 403."""
        resp = client.get("/api/v1/meals/")
        assert resp.status_code == 403
