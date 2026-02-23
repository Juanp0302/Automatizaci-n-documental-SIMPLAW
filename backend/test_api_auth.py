import requests

BASE_URL = "http://localhost:8000/api/v1"

# Login
login_data = {"username": "admin@example.com", "password": "securepassword"}
response = requests.post(f"{BASE_URL}/login/access-token", data=login_data)

if response.status_code == 200:
    token = response.json().get("access_token")
    headers = {"Authorization": f"Bearer {token}"}
    
    # Test Templates
    print("\n--- Templates ---")
    res_templates = requests.get(f"{BASE_URL}/templates/", headers=headers)
    print(f"Status: {res_templates.status_code}")
    print(res_templates.text[:500])
    
    # Test Documents
    print("\n--- Documents ---")
    res_docs = requests.get(f"{BASE_URL}/documents/", headers=headers)
    print(f"Status: {res_docs.status_code}")
    print(res_docs.text[:500])
else:
    print(f"Login failed: {response.text}")
