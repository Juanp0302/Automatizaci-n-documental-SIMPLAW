import requests
import sys
import datetime

BASE_URL = "http://127.0.0.1:8000/api/v1"

def test_filtering():
    # 1. Login
    login_url = f"{BASE_URL}/login/access-token"
    payload = {
        "username": "admin@example.com",
        "password": "admin"
    }
    
    try:
        print(f"Logging in...")
        response = requests.post(login_url, data=payload)
        if response.status_code != 200:
            print(f"Login failed: {response.status_code} {response.text}")
            return
        
        token = response.json().get("access_token")
        headers = {"Authorization": f"Bearer {token}"}
        print("Login SUCCESS")
        
        # 2. List Templates (to get an ID if needed, though we might just list docs)
        print("Listing templates...")
        resp = requests.get(f"{BASE_URL}/templates/", headers=headers)
        templates = resp.json()
        print(f"Found {len(templates)} templates")

        # 3. List Documents (Baseline)
        print("Listing all documents...")
        resp = requests.get(f"{BASE_URL}/documents/", headers=headers)
        documents = resp.json()
        print(f"Found {len(documents)} documents total")
        
        target_title = "Test"
        if len(documents) > 0:
            target_title = documents[0]['title']
        else:
            # Create a doc if needed, but let's assume existence for now or skip
            if len(templates) > 0:
                print("Creating a test document...")
                create_payload = {
                    "title": "UniqueSearchTerm123",
                    "template_id": templates[0]['id'],
                    "variables": {}
                }
                resp = requests.post(f"{BASE_URL}/documents/", json=create_payload, headers=headers)
                if resp.status_code == 200:
                    target_title = "UniqueSearchTerm123"
                    print("Created test document")
                else:
                    print(f"Failed to create doc: {resp.text}")
            else:
                print("No templates found, cannot create document to test.")
                return

        # 4. Test Search
        print(f"Searching for '{target_title}'...")
        resp = requests.get(f"{BASE_URL}/documents/?search={target_title}", headers=headers)
        search_results = resp.json()
        print(f"Found {len(search_results)} results for '{target_title}'")
        
        if len(search_results) > 0 and any(d['title'] == target_title for d in search_results):
            print("PASS: Search returned correct document")
        else:
            print("FAIL: Search did not return expected document")

        # 5. Test Non-existent Search
        print("Searching for 'NonExistentXYZ'...")
        resp = requests.get(f"{BASE_URL}/documents/?search=NonExistentXYZ", headers=headers)
        empty_results = resp.json()
        print(f"Found {len(empty_results)} results")
        
        if len(empty_results) == 0:
            print("PASS: Search returned 0 results for non-existent term")
        else:
            print("FAIL: Search returned results for non-existent term")

        # 6. Test Date Filtering
        # Future date
        future_date = (datetime.datetime.now() + datetime.timedelta(days=365)).isoformat()
        print(f"Filtering start_date={future_date}...")
        resp = requests.get(f"{BASE_URL}/documents/?start_date={future_date}", headers=headers)
        future_results = resp.json()
        print(f"Found {len(future_results)} results for future date")
        
        if len(future_results) == 0:
            print("PASS: Date filter works (0 results for future)")
        else:
            print(f"FAIL: Date filter returned {len(future_results)} results for future date")
            
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_filtering()
