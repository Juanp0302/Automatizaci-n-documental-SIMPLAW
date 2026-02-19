import pytest
from httpx import AsyncClient
from app import crud, schemas
from sqlalchemy.orm import Session

# Mock data
ADMIN_EMAIL = "admin_test@example.com"
ADMIN_PASSWORD = "adminpassword"
USER_EMAIL = "user_test@example.com"
USER_PASSWORD = "userpassword"

@pytest.mark.asyncio
async def test_users_endpoints(client: AsyncClient, db: Session):
    # 0. Setup: Create admin and normal user
    admin_in = schemas.UserCreate(email=ADMIN_EMAIL, password=ADMIN_PASSWORD, full_name="Admin User", is_superuser=True)
    admin = crud.user.create(db, obj_in=admin_in)
    
    user_in = schemas.UserCreate(email=USER_EMAIL, password=USER_PASSWORD, full_name="Normal User")
    normal_user = crud.user.create(db, obj_in=user_in)
    
    # Login as Admin
    login_res = await client.post(
        "/api/v1/login/access-token",
        data={"username": ADMIN_EMAIL, "password": ADMIN_PASSWORD},
    )
    admin_token = login_res.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # 1. Test List Users (Admin only)
    list_res = await client.get("/api/v1/users/", headers=admin_headers)
    assert list_res.status_code == 200
    users = list_res.json()
    assert len(users) >= 2

    # 2. Test Get Specific User
    get_res = await client.get(f"/api/v1/users/{normal_user.id}", headers=admin_headers)
    assert get_res.status_code == 200
    assert get_res.json()["email"] == USER_EMAIL

    # 3. Test Update User (Admin updates normal user)
    update_data = {"full_name": "Updated Name", "is_active": True}
    put_res = await client.put(f"/api/v1/users/{normal_user.id}", headers=admin_headers, json=update_data)
    assert put_res.status_code == 200
    assert put_res.json()["full_name"] == "Updated Name"

    # 4. Test Normal User Restrictions
    # Login as Normal User
    login_user_res = await client.post(
        "/api/v1/login/access-token",
        data={"username": USER_EMAIL, "password": USER_PASSWORD},
    )
    user_token = login_user_res.json()["access_token"]
    user_headers = {"Authorization": f"Bearer {user_token}"}

    # Try to list users (should fail)
    fail_list = await client.get("/api/v1/users/", headers=user_headers)
    assert fail_list.status_code == 400 # Or 403 depending on implementation

    # Try to get another user (should fail or return 400/403)
    # The endpoint might return 200 if open, but usually restricted.
    # checking users.py: router.get("/{user_id}", ... params: current_user)
    # If not superuser and user_id != current_user.id -> 400 Not enough permissions
    fail_get = await client.get(f"/api/v1/users/{admin.id}", headers=user_headers)
    assert fail_get.status_code == 400

    # Test Get Self
    self_res = await client.get(f"/api/v1/users/{normal_user.id}", headers=user_headers)
    assert self_res.status_code == 200
    assert self_res.json()["email"] == USER_EMAIL
