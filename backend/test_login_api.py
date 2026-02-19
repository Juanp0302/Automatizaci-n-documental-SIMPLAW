import requests
import sys

def test_login():
    url = "http://127.0.0.1:8000/api/v1/login/access-token"
    # Content-type x-www-form-urlencoded is default for requests.post with data=dict
    payload = {
        "username": "admin@example.com",
        "password": "admin"
    }
    
    try:
        print(f"Testing login at {url}...")
        response = requests.post(url, data=payload)
        
        print(f"Status Code: {response.status_code}")
        try:
            print(f"Response: {response.json()}")
        except:
            print(f"Response (text): {response.text}")
        
        if response.status_code == 200:
            token = response.json().get("access_token")
            if token:
                print("Login SUCCESS: Token received")
                return
        print("Login FAILED")
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_login()
