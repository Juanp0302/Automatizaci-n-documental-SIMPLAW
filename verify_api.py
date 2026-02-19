import requests
import os

BASE_URL = "http://localhost:8001/api/v1"
USERNAME = "admin@example.com"
PASSWORD = "admin"

def verify_api():
    session = requests.Session()
    
    # 1. Login
    print("1. Logging in...")
    login_data = {
        "username": USERNAME,
        "password": PASSWORD
    }
    response = session.post(f"{BASE_URL}/login/access-token", data=login_data)
    if response.status_code != 200:
        print(f"Login failed: {response.text}")
        return
    token = response.json().get("access_token")
    headers = {"Authorization": f"Bearer {token}"}
    print("Login successful.")

    # 2. List Templates
    print("2. Listing templates...")
    response = session.get(f"{BASE_URL}/templates/", headers=headers)
    if response.status_code != 200:
        print(f"Failed to list templates: {response.text}")
        return
    templates = response.json()
    if not templates:
        print("No templates found. Cannot proceed with document generation.")
        return
    template_id = templates[0]['id']
    print(f"Found {len(templates)} templates. Using first template ID: {template_id}")

    # 3. Create Document
    print("3. Creating document...")
    doc_data = {
        "title": "API Verification Document",
        "template_id": template_id,
        "variables": {}
    }
    response = session.post(f"{BASE_URL}/documents/", json=doc_data, headers=headers)
    if response.status_code != 200:
        print(f"Failed to create document: {response.text}")
        return
    document = response.json()
    doc_id = document['id']
    print(f"Document created successfully. ID: {doc_id}")

    # 4. Download Document
    print("4. Downloading document...")
    response = session.get(f"{BASE_URL}/documents/{doc_id}/download", headers=headers)
    if response.status_code != 200:
        print(f"Failed to download document: {response.status_code} {response.text}")
        return
    
    filename = "downloaded_test_doc.docx"
    with open(filename, "wb") as f:
        f.write(response.content)
    
    file_size = os.path.getsize(filename)
    print(f"Download successful. Saved to {filename} ({file_size} bytes)")
    
    if file_size > 0:
        print("VERIFICATION SUCCESS: Document generation and download flow works.")
    else:
        print("VERIFICATION FAILED: Downloaded file is empty.")

if __name__ == "__main__":
    verify_api()
