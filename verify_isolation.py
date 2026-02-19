
import requests
import sys

BASE_URL = "http://localhost:8001/api/v1"

def register_user(email, password):
    # Try login first to get token if exists
    response = requests.post(f"{BASE_URL}/login/access-token", data={"username": email, "password": password})
    if response.status_code == 200:
        return response.json()["access_token"]
    
    # Register if not exists (assuming open registration or similar endpoint availability, 
    # but strictly we usually use /users/open or admin creates it. 
    # Let's try to use the admin to create users if needed, or just assume they exist/we create them via open endpoint if available.
    # Actually, looking at the file structure, we have users.py.
    # Let's assume we can create users via /users/ if we are admin, or /users/open.
    # For simplicity in this test, let's assume we have an admin token and use it to create users.
    return None

def get_admin_token():
    response = requests.post(f"{BASE_URL}/login/access-token", data={"username": "admin@example.com", "password": "admin"})
    if response.status_code != 200:
        print("Failed to get admin token")
        sys.exit(1)
    return response.json()["access_token"]

def create_user(admin_token, email, password):
    headers = {"Authorization": f"Bearer {admin_token}"}
    user_data = {"email": email, "password": password, "full_name": "Test User", "is_active": True}
    # Check if user exists
    # This part depends on the API. Let's just try to create and ignore 400 (already exists)
    response = requests.post(f"{BASE_URL}/users/", json=user_data, headers=headers)
    if response.status_code == 200:
        print(f"Created user {email}")
    elif response.status_code == 400:
        print(f"User {email} likely exists")
    else:
        print(f"Failed to create user {email}: {response.text}")

def get_user_token(email, password):
    response = requests.post(f"{BASE_URL}/login/access-token", data={"username": email, "password": password})
    if response.status_code != 200:
        print(f"Failed to get token for {email}: {response.text}")
        sys.exit(1)
    return response.json()["access_token"]

def main():
    admin_token = get_admin_token()
    
    # Create User A and User B
    create_user(admin_token, "usera@example.com", "password123")
    create_user(admin_token, "userb@example.com", "password123")
    
    token_a = get_user_token("usera@example.com", "password123")
    token_b = get_user_token("userb@example.com", "password123")
    
    # User A uploads a template
    print("\n--- User A uploading template ---")
    headers_a = {"Authorization": f"Bearer {token_a}"}
    files = {'file': ('template_a.docx', b'fake content', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')}
    data = {'title': 'Template A'}
    # Note: verify if we can upload without a real docx. The backend checks file extension but maybe not content structure for upload, 
    # BUT get_template_variables might fail. create_template just copies file.
    
    # We need a real file path for the test potentially, or just mock it.
    # create_template copies file.
    
    response = requests.post(f"{BASE_URL}/templates/", headers=headers_a, files=files, data=data)
    if response.status_code != 200:
        print(f"User A failed to upload template: {response.text}")
        # If it fails due to file validation (unlikely based on code), we proceed.
    else:
        print("User A uploaded 'Template A'")

    # User B lists templates
    print("\n--- User B listing templates ---")
    headers_b = {"Authorization": f"Bearer {token_b}"}
    response = requests.get(f"{BASE_URL}/templates/", headers=headers_b)
    if response.status_code != 200:
        print(f"User B failed to list templates: {response.status_code} {response.text}")
        sys.exit(1)
    templates = response.json()
    print(f"User B sees {len(templates)} templates")
    
    found = any(t['title'] == 'Template A' for t in templates)
    if found:
        print("FAIL: User B sees User A's template!")
    else:
        print("SUCCESS: User B does not see User A's template.")

    # User A lists templates
    print("\n--- User A listing templates ---")
    response = requests.get(f"{BASE_URL}/templates/", headers=headers_a)
    templates = response.json()
    print(f"User A sees {len(templates)} templates")
    found = any(t['title'] == 'Template A' for t in templates)
    if found:
        print("SUCCESS: User A sees their own template.")
    else:
         print("FAIL: User A cannot see their own template!")

if __name__ == "__main__":
    main()
