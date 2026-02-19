import requests
import sys

BASE_URL = "http://localhost:8001/api/v1"

def check_endpoint(endpoint):
    url = f"{BASE_URL}/{endpoint}"
    print(f"Checking {url}...")
    try:
        # We need a token? accessing public endpoints or assume validation error if 401
        # But wait, read_documents requires auth.
        # Let's try to login first.
        login_url = f"{BASE_URL}/login/access-token"
        # I need a user. Default admin?
        # Trying a clearer approach: check health or public endpoint if any.
        # But documents/templates are protected.
        
        # Let's try to get token
        resp = requests.post(login_url, data={"username": "test@example.com", "password": "password123"})
        if resp.status_code != 200:
            print(f"Login failed: {resp.status_code} {resp.text}")
            return
        
        token = resp.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        resp = requests.get(url, headers=headers)
        print(f"Status: {resp.status_code}")
        if resp.status_code != 200:
            print(f"Error: {resp.text}")
        else:
            print(f"Success. Count: {len(resp.json())}")
            
    except Exception as e:
        print(f"Exception: {e}")

if __name__ == "__main__":
    print("Checking Templates...")
    check_endpoint("templates/")
    print("\nChecking Documents...")
    check_endpoint("documents/")
