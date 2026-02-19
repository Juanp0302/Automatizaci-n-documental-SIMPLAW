import sys
import os
import requests
from datetime import datetime, timedelta

# Configuration
BASE_URL = "http://localhost:8000/api/v1"
USERNAME = "admin@example.com"
PASSWORD = "admin"

def login():
    url = f"{BASE_URL}/login/access-token"
    data = {
        "username": USERNAME,
        "password": PASSWORD
    }
    response = requests.post(url, data=data)
    if response.status_code != 200:
        print(f"Login failed: {response.text}")
        return None
    return response.json()["access_token"]

def test_search(token):
    headers = {"Authorization": f"Bearer {token}"}
    
    # 1. Get all documents
    print("\n1. Getting all documents...")
    response = requests.get(f"{BASE_URL}/documents/", headers=headers)
    docs = response.json()
    print(f"Found {len(docs)} documents.")
    if not docs:
        print("No documents found. Please generate some documents first.")
        return

    first_doc = docs[0]
    title_part = first_doc['title'][:3]
    
    # 2. Test Search
    print(f"\n2. Testing search for '{title_part}'...")
    response = requests.get(f"{BASE_URL}/documents/?search={title_part}", headers=headers)
    search_results = response.json()
    print(f"Found {len(search_results)} documents.")
    for doc in search_results:
        if title_part.lower() not in doc['title'].lower():
            print(f"❌ FAIL: '{title_part}' not in '{doc['title']}'")
        else:
            print(f"✅ PASS: '{doc['title']}' matches")

    # 3. Test Date Filter (Today)
    print("\n3. Testing date filter (Today)...")
    now = datetime.now()
    start_date = datetime(now.year, now.month, now.day).isoformat()
    
    response = requests.get(f"{BASE_URL}/documents/?start_date={start_date}", headers=headers)
    date_results = response.json()
    print(f"Found {len(date_results)} documents created today.")
    
    # 4. Test Date Filter (Future - should be empty)
    print("\n4. Testing date filter (Future)...")
    future_date = (datetime.now() + timedelta(days=1)).isoformat()
    response = requests.get(f"{BASE_URL}/documents/?start_date={future_date}", headers=headers)
    future_results = response.json()
    print(f"Found {len(future_results)} documents (expected 0).")
    if len(future_results) == 0:
        print("✅ PASS: No documents found in future.")
    else:
        print(f"❌ FAIL: Found documents in future!")

if __name__ == "__main__":
    try:
        token = login()
        if token:
            test_search(token)
    except Exception as e:
        print(f"An error occurred: {e}")
