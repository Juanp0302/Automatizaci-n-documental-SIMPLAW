
import requests
import json

API_URL = "http://127.0.0.1:8000/api/v1"

def get_token():
    try:
        response = requests.post(
            f"{API_URL}/login/access-token",
            data={"username": "admin@example.com", "password": "admin"}
        )
        if response.status_code == 200:
            return response.json().get("access_token")
        else:
            print(f"Login failed: {response.status_code} {response.text}")
            return None
    except Exception as e:
        print(f"Login error: {e}")
        return None

def check_endpoint(endpoint, token):
    print(f"Checking {endpoint}...")
    try:
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get(f"{API_URL}/{endpoint}", headers=headers)
        print(f"Status Code: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"Count: {len(data) if isinstance(data, list) else 'N/A'}")
            if isinstance(data, list) and len(data) > 0:
                print(f"First item: {json.dumps(data[0], indent=2)}")
        else:
            print(f"Response: {response.text[:200]}")
    except Exception as e:
        print(f"Error: {e}")
    print("-" * 20)

if __name__ == "__main__":
    token = get_token()
    if token:
        check_endpoint("templates/", token)
        check_endpoint("documents/", token)
        check_endpoint("users/me", token)
    else:
        print("Could not get token.")
