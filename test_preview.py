import requests
import os

# Configuration
API_URL = "http://localhost:8001/api/v1"
# Login credentials - assuming default admin/admin or similar, need to check how to auth
# But wait, let's look at previous tests or how to get a token.

# Actually, I can use the same logic as test_pdf_export.py if it exists, or just use requests with a valid token.
# Let's try to login first.

def login(email, password):
    response = requests.post(f"{API_URL}/login/access-token", data={"username": email, "password": password})
    if response.status_code == 200:
        return response.json()["access_token"]
    else:
        print(f"Login failed: {response.text}")
        return None

def get_first_template_id(token):
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(f"{API_URL}/templates/", headers=headers, params={"skip": 0, "limit": 1})
    if response.status_code == 200:
        data = response.json()
        if data:
            return data[0]["id"]
    print(f"Failed to get templates: {response.text}")
    return None

def test_preview(token, template_id):
    headers = {"Authorization": f"Bearer {token}"}
    data = {
        "title": "Preview Test Doc",
        "template_id": template_id,
        "variables": {"nombre": "Juan Preview", "fecha": "2023-01-01"}
    }
    
    print(f"Requesting preview for template {template_id}...")
    response = requests.post(f"{API_URL}/documents/preview", json=data, headers=headers)
    
    if response.status_code == 200:
        print("Success! Preview generated.")
        print(f"Content Type: {response.headers.get('content-type')}")
        print(f"Content Length: {len(response.content)} bytes")
        
        with open("preview_test.pdf", "wb") as f:
            f.write(response.content)
        print("Saved to preview_test.pdf")
        return True
    else:
        print(f"Preview failed: {response.status_code} - {response.text}")
        return False

if __name__ == "__main__":
    # Try default credentials
    email = "admin@example.com"
    password = "admin" # Guessing, usually it's this or check previous logs/seeds
    
    # If not, create a user? No, let's assume admin exists.
    # Actually, I should check seeds or just try.
    
    token = login(email, password)
    if not token:
        # Try another user from previous context if available
        print("Trying user@example.com...")
        token = login("user@example.com", "password")
        
    if token:
        template_id = get_first_template_id(token)
        if template_id:
            test_preview(token, template_id)
        else:
            print("No templates found to test.")
    else:
        print("Could not log in.")
