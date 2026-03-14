"""
E2E Test: Admin role flows
Verifies admin-only endpoints and access control enforcement.
"""
import pytest
from app.models.user import User
from app.utils.security import get_password_hash


# ─────────────────────────────────────────────
# Fixtures
# ─────────────────────────────────────────────

@pytest.fixture
def admin_user(db_session):
    """Create a verified admin user directly in the test DB."""
    user = User(
        email="admin@example.com",
        hashed_password=get_password_hash("AdminPass1!"),
        name="Admin User",
        is_verified=True,
        role="admin",
        daily_water_goal_ml=2000,
        compliance_check_frequency_days=14
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def admin_headers(client, admin_user):
    """Get auth headers for the admin user."""
    resp = client.post("/api/v1/auth/login", json={
        "email": "admin@example.com",
        "password": "AdminPass1!"
    })
    assert resp.status_code == 200, f"Admin login failed: {resp.text}"
    token = resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def regular_headers(client, test_user):
    """Get auth headers for the regular (non-admin) test user."""
    resp = client.post("/api/v1/auth/login", json={
        "email": "test@example.com",
        "password": "testpass123"
    })
    token = resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


# ─────────────────────────────────────────────
# FLOW 2: Admin Panel Tests
# ─────────────────────────────────────────────

class TestAdminFlow:
    """Verify admin-only access control and panel functionality."""

    def test_01_admin_can_list_all_users(self, client, admin_headers, test_user, admin_user):
        """Admin can view all registered users."""
        resp = client.get("/api/v1/auth/users", headers=admin_headers)
        assert resp.status_code == 200, resp.text
        users = resp.json()
        assert len(users) >= 2
        emails = [u["email"] for u in users]
        assert "test@example.com" in emails
        assert "admin@example.com" in emails

    def test_02_regular_user_cannot_list_users(self, client, regular_headers):
        """Regular (non-admin) users are blocked from the user list endpoint."""
        resp = client.get("/api/v1/auth/users", headers=regular_headers)
        assert resp.status_code == 403, resp.text

    def test_03_unauthenticated_cannot_list_users(self, client):
        """Unauthenticated requests to admin endpoint are rejected."""
        resp = client.get("/api/v1/auth/users")
        assert resp.status_code == 403, resp.text

    def test_04_admin_can_view_client_recommendations(
        self, client, admin_headers, test_user
    ):
        """Admin can fetch recommendations for any user via client_id param."""
        resp = client.get(
            f"/api/v1/recommendations/?client_id={test_user.id}",
            headers=admin_headers
        )
        # Should return successfully (empty list is fine)
        assert resp.status_code == 200, resp.text
        assert isinstance(resp.json(), list)

    def test_05_regular_user_cannot_view_other_client_recommendations(
        self, client, regular_headers, admin_user
    ):
        """Regular user cannot access another user's recommendations."""
        resp = client.get(
            f"/api/v1/recommendations/?client_id={admin_user.id}",
            headers=regular_headers
        )
        assert resp.status_code == 403, resp.text

    def test_06_admin_profile_has_correct_role(self, client, admin_headers):
        """Admin's profile correctly reflects role='admin'."""
        resp = client.get("/api/v1/auth/me", headers=admin_headers)
        assert resp.status_code == 200, resp.text
        assert resp.json()["role"] == "admin"

    def test_07_regular_user_profile_has_client_role(self, client, regular_headers):
        """Regular user's profile correctly reflects role='client'."""
        resp = client.get("/api/v1/auth/me", headers=regular_headers)
        assert resp.status_code == 200, resp.text
        assert resp.json()["role"] == "client"
