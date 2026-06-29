import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.core.config import settings


@pytest.mark.asyncio
async def test_auth_registration_and_login(override_get_db):
    """Test user registration and subsequent login flow."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # 1. Register a test operator
        reg_payload = {
            "email": "analyst_test@mantra.io",
            "password": "securepassword123",
            "role": "Security Analyst"
        }
        reg_res = await ac.post(f"{settings.API_V1_STR}/auth/register", json=reg_payload)
        assert reg_res.status_code == 201
        data = reg_res.json()
        assert data["email"] == "analyst_test@mantra.io"
        assert data["role"] == "Admin" # First user registered automatically becomes Admin
        
        # 2. Login as the newly created operator
        login_payload = {
            "email": "analyst_test@mantra.io",
            "password": "securepassword123"
        }
        login_res = await ac.post(f"{settings.API_V1_STR}/auth/login", json=login_payload)
        assert login_res.status_code == 200
        tokens = login_res.json()
        assert "access_token" in tokens
        assert "refresh_token" in tokens
        assert tokens["role"] == "Admin"
        
        # 3. Request profile with auth headers
        headers = {"Authorization": f"Bearer {tokens['access_token']}"}
        profile_res = await ac.get(f"{settings.API_V1_STR}/auth/me", headers=headers)
        assert profile_res.status_code == 200
        profile = profile_res.json()
        assert profile["email"] == "analyst_test@mantra.io"
        
        # 4. Refresh token
        refresh_payload = {
            "refresh_token": tokens["refresh_token"]
        }
        refresh_res = await ac.post(f"{settings.API_V1_STR}/auth/refresh", json=refresh_payload)
        assert refresh_res.status_code == 200
        new_tokens = refresh_res.json()
        assert "access_token" in new_tokens
