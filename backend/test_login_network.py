import requests
import sys

# API URL
API_URL = "http://localhost:8000/api/v1/login/access-token"

def test_login():
    print(f"Attempting login to {API_URL}...")
    payload = {
        "username": "admin@example.com",
        "password": "admin"
    }
    headers = {
        "Content-Type": "application/x-www-form-urlencoded"
    }
    
    try:
        response = requests.post(API_URL, data=payload, headers=headers)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 200:
            print("Layout: SUCCESS")
        else:
            print("Layout: FAILURE")
            
    except requests.exceptions.ConnectionError:
        print("Error: Could not connect to server. Is it running?")
    except Exception as e:
        print(f"An error occurred: {e}")

if __name__ == "__main__":
    test_login()
