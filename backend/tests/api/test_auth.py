import pytest
from httpx import AsyncClient
from sqlalchemy.orm import Session
from app.core.config import settings
from app import crud
from app.schemas.user import UserCreate

@pytest.mark.asyncio
async def test_login_access_token(client: AsyncClient, db: Session) -> None:
    username = "test@example.com"
    password = "password123"
    # Ensure user doesn't exist
    user = crud.user.get_by_email(db, email=username)
    if not user:
        user_in = UserCreate(email=username, password=password)
        user = crud.user.create(db, obj_in=user_in)

    login_data = {
        "username": username,
        "password": password
    }
    r = await client.post(f"{settings.API_V1_STR}/login/access-token", data=login_data)
    if r.status_code != 200:
        print(f"Login failed: {r.text}")
    tokens = r.json()
    assert r.status_code == 200
    assert "access_token" in tokens
    assert tokens["access_token"]

@pytest.mark.asyncio
async def test_use_access_token(client: AsyncClient, db: Session) -> None:
    username = "test2@example.com"
    password = "password123"
    # Ensure user doesn't exist
    user = crud.user.get_by_email(db, email=username)
    if not user:
        user_in = UserCreate(email=username, password=password)
        user = crud.user.create(db, obj_in=user_in)
    
    # Login to get token
    login_data = {
        "username": username,
        "password": password
    }
    r = await client.post(f"{settings.API_V1_STR}/login/access-token", data=login_data)
    tokens = r.json()
    a_token = tokens["access_token"]
    
    headers = {"Authorization": f"Bearer {a_token}"}
    r = await client.get(f"{settings.API_V1_STR}/users/me", headers=headers)
    assert r.status_code == 200
    assert r.json()["email"] == username
