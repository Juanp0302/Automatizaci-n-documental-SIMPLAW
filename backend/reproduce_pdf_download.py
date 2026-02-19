
import requests
import os

# Configuration
API_URL = "http://localhost:8001/api/v1"
DOC_ID = 21  # We know this ID exists
TOKEN_FILE = "token.txt" # Not used here, assuming public or we can login if needed. 
# Actually, the endpoint requires authentication. 
# We need to login first or hack the token.

# Let's try to login independently
def login(email, password):
    try:
        response = requests.post(f"{API_URL}/login/access-token", data={
            "username": email,
            "password": password
        })
        if response.status_code == 200:
            return response.json()["access_token"]
        else:
            print(f"Login failed: {response.text}")
            return None
    except Exception as e:
        print(f"Login error: {e}")
        return None

# Hardcoded credentials for development/testing environment
# If this fails, we might need to ask user or use a SuperUser 
TOKEN = login("admin@example.com", "admin") 

if not TOKEN:
    print("Could not log in. Aborting.")
    # Fallback: Maybe the endpoint doesn't enforce strict auth locally? (It does).
    # We will try to rely on the backend logging passing the auth if valid.
    # Actually, we can just use the requests with a 'fake' token if we disable the dependency check 
    # but that's harder.
    token_path = os.path.join(os.path.dirname(__file__), "test_token.txt")
    if os.path.exists(token_path):
        with open(token_path, "r") as f:
            TOKEN = f.read().strip()
    
if not TOKEN:
    # Attempt with a known test user if admin fails
    TOKEN = login("user@example.com", "password")

if not TOKEN:
    print("CRITICAL: Cannot get a valid token. Script might fail purely on Auth.")

headers = {
    "Authorization": f"Bearer {TOKEN}"
}

print(f"Attempting download for Doc ID {DOC_ID}...")

try:
    url = f"{API_URL}/documents/{DOC_ID}/download?format=pdf"
    response = requests.get(url, headers=headers)
    
    print(f"Status Code: {response.status_code}")
    if response.status_code != 200:
        print("Response Text:")
        print(response.text)
    else:
        # Save it
        with open(f"downloaded_{DOC_ID}.pdf", "wb") as f:
            f.write(response.content)
        print("Download successful!")

except Exception as e:
    print(f"Request failed: {e}")
