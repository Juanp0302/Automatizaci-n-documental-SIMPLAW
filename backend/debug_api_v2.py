
import urllib.request
import urllib.parse
import json
import sys

BASE_URL = "http://localhost:8001/api/v1"
USERNAME = "admin@example.com"
PASSWORD = "admin"

def debug():
    print(f"Attempting login to {BASE_URL}/login/access-token")
    try:
        data = urllib.parse.urlencode({"username": USERNAME, "password": PASSWORD}).encode()
        req = urllib.request.Request(
            f"{BASE_URL}/login/access-token",
            data=data,
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        
        with urllib.request.urlopen(req) as response:
            print(f"Login Status: {response.status}")
            resp_body = response.read().decode()
            token_data = json.loads(resp_body)
            
        token = token_data.get("access_token")
        if not token:
            print("No access token in response")
            return
        
        print("Login successful. Getting documents...")
        
        req = urllib.request.Request(
            f"{BASE_URL}/documents",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        with urllib.request.urlopen(req) as response:
            print(f"Documents Status: {response.status}")
            resp_body = response.read().decode()
            print(f"Documents: {resp_body}")

    except urllib.error.HTTPError as e:
        print(f"HTTP Error: {e.code} {e.reason}")
        print(e.read().decode())
    except Exception as e:
        print(f"Exception: {e}")

if __name__ == "__main__":
    debug()
