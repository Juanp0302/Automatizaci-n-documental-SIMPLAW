
import requests
import json

API_URL = "http://localhost:8000/api/v1"

def check_endpoint(endpoint):
    print(f"Checking {endpoint}...")
    try:
        response = requests.get(f"{API_URL}/{endpoint}")
        print(f"Status Code: {response.status_code}")
        try:
            print(f"Response: {json.dumps(response.json(), indent=2)}")
        except:
            print(f"Raw Response: {response.text[:200]}")
    except Exception as e:
        print(f"Error: {e}")
    print("-" * 20)

if __name__ == "__main__":
    # Note: These will likely fail with 401 if not authenticated, 
    # but the browser agent reported 500.
    # If it's a 500, it means it crashed before or during the request processing.
    check_endpoint("templates/")
    check_endpoint("documents/")
    check_endpoint("users/me")
