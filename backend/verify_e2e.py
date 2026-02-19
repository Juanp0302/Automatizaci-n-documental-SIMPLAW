import requests
import os
import time

BASE_URL = "http://localhost:8001/api/v1"
LOGIN_URL = f"{BASE_URL}/login/access-token"
TEMPLATES_URL = f"{BASE_URL}/templates/"
DOCUMENTS_URL = f"{BASE_URL}/documents/"

TEST_USER_EMAIL = "admin@example.com"
TEST_USER_PASSWORD = "admin"
TEMPLATE_FILE = "test_doc.docx"

def login():
    response = requests.post(LOGIN_URL, data={"username": TEST_USER_EMAIL, "password": TEST_USER_PASSWORD})
    if response.status_code != 200:
        print(f"Login failed: {response.text}")
        return None
    return response.json()["access_token"]

def upload_template(token):
    headers = {"Authorization": f"Bearer {token}"}
    files = {"file": open(TEMPLATE_FILE, "rb")}
    data = {"title": "Test Template E2E"}
    response = requests.post(TEMPLATES_URL, headers=headers, files=files, data=data)
    if response.status_code != 200:
        print(f"Upload failed: {response.text}")
        return None
    return response.json()

def generate_document(token, template_id):
    headers = {"Authorization": f"Bearer {token}"}
    data = {
        "title": "Generated E2E Doc",
        "template_id": template_id,
        "variables": {
            "name": "E2E Test User",
            "date": "2024-01-01"
        }
    }
    response = requests.post(DOCUMENTS_URL, json=data, headers=headers)
    if response.status_code != 200:
        print(f"Generation failed: {response.text}")
        return None
    return response.json()

def download_document(token, document_id):
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(f"{DOCUMENTS_URL}{document_id}/download", headers=headers)
    if response.status_code != 200:
        print(f"Download failed: {response.text}")
        return False
    
    with open("downloaded_test.docx", "wb") as f:
        f.write(response.content)
    return True

def main():
    print("Starting E2E Verification...")
    
    # 1. Login
    token = login()
    if not token:
        exit(1)
    print("Login successful.")

    # 2. Upload Template
    # Ensure test_doc.docx exists
    if not os.path.exists(TEMPLATE_FILE):
        # Create a dummy file if not exists
        from docx import Document
        doc = Document()
        doc.add_paragraph("Hello {{name}}, today is {{date}}.")
        doc.save(TEMPLATE_FILE)
        print(f"Created dummy {TEMPLATE_FILE}")

    template = upload_template(token)
    if not template:
        exit(1)
    print(f"Template uploaded: {template['id']}")

    # 3. Generate Document
    doc = generate_document(token, template['id'])
    if not doc:
        exit(1)
    print(f"Document generated: {doc['id']}")

    # 4. Download Document
    if download_document(token, doc['id']):
        print("Document downloaded successfully.")
    else:
        print("Document download failed.")
        exit(1)

    print("Verification Passed!")

if __name__ == "__main__":
    main()
