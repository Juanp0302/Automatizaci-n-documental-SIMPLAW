import requests
import sys

def debug_documents_list():
    # 1. Login
    login_url = "http://127.0.0.1:8000/api/v1/login/access-token"
    # Assuming we are testing with the admin user
    login_payload = {
        "username": "admin@example.com",
        "password": "admin"
    }
    
    try:
        print("Logging in...")
        login_response = requests.post(login_url, data=login_payload)
        if login_response.status_code != 200:
            print(f"Login failed: {login_response.text}")
            return
        
        token = login_response.json().get("access_token")
        headers = {"Authorization": f"Bearer {token}"}
        print("Login successful.")

        # 2. Get Documents
        docs_url = "http://127.0.0.1:8000/api/v1/documents/"
        print(f"Fetching documents from {docs_url}...")
        response = requests.get(docs_url, headers=headers)
        
        print(f"Status Code: {response.status_code}")
        if response.status_code != 200:
            print(f"Error Response: {response.text}")
        else:
            print("Documents fetched successfully:")
            print(response.json())

    except Exception as e:
        print(f"Exception: {e}")

if __name__ == "__main__":
    debug_documents_list()
