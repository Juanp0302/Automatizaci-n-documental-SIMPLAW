
import requests

def verify():
    base_url = "http://localhost:8001/api/v1"
    
    # 1. Login
    print("Logging in...")
    try:
        response = requests.post(f"{base_url}/login/access-token", data={
            "username": "admin@example.com",
            "password": "admin"
        })
        
        if response.status_code != 200:
             print(f"Login failed: {response.text}")
             return
             
        token = response.json()["access_token"]
        print("Login successful.")
        
        # 2. List Templates
        print("Listing templates...")
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get(f"{base_url}/templates/", headers=headers)
        
        if response.status_code == 200:
             templates = response.json()
             print(f"Success! Found {len(templates)} templates.")
             for t in templates:
                 print(f" - {t.get('title')} (ID: {t.get('id')})")
        else:
             print(f"Failed to list templates: {response.text}")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    verify()
