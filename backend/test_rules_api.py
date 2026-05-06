import requests
import sqlite3
from jose import jwt
import os

# Mock settings/security for token generation
SECRET_KEY = "test_secret_key" # Need to find the real one
ALGORITHM = "HS256"

def get_secret():
    # Try to find SECRET_KEY in .env
    with open(".env", "r") as f:
        for line in f:
            if "SECRET_KEY" in line:
                return line.split("=")[1].strip().strip('"')
    return "test_secret_key"

def test_api():
    secret = get_secret()
    token = jwt.encode({"sub": "1"}, secret, algorithm=ALGORITHM)
    headers = {"Authorization": f"Bearer {token}"}
    
    url = "http://localhost:8000/api/v1/extractor/projects/1/rules"
    try:
        res = requests.get(url, headers=headers)
        print(f"Status: {res.status_code}")
        print(f"Data: {res.text}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_api()
