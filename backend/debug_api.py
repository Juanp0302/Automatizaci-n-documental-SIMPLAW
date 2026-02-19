
import requests
import json

BASE_URL = "http://localhost:8001/api/v1"
USERNAME = "admin@example.com"
PASSWORD = "admin"

def debug():
    print(f"Attempting login to {BASE_URL}/login/access-token")
    try:
        resp = requests.post(
            f"{BASE_URL}/login/access-token",
            data={"username": USERNAME, "password": PASSWORD},
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        print(f"Login Status: {resp.status_code}")
        if resp.status_code != 200:
            print(f"Login Failed: {resp.text}")
            return

        token_data = resp.json()
        token = token_data.get("access_token")
        if not token:
            print("No access token in response")
            return
        
        print("Login successful. Getting documents...")
        
        headers = {"Authorization": f"Bearer {token}"}
        resp = requests.get(f"{BASE_URL}/documents", headers=headers)
        
        print(f"Documents Status: {resp.status_code}")
        if resp.status_code != 200:
            print(f"Documents Error: {resp.text}")
        else:
            print(f"Documents: {json.dumps(resp.json(), indent=2)}")

    except Exception as e:
        print(f"Exception: {e}")

if __name__ == "__main__":
    debug()
