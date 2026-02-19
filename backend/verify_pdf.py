import requests
import sys

BASE_URL = "http://localhost:8000"
EMAIL = "admin@example.com"
PASSWORD = "admin"

def verify_pdf_export():
    session = requests.Session()
    
    # 1. Login
    print("Logging in...")
    login_data = {
        "username": EMAIL,
        "password": PASSWORD
    }
    try:
        response = session.post(f"{BASE_URL}/api/v1/login/access-token", data=login_data)
        response.raise_for_status()
        token = response.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        print("Login successful.")
    except Exception as e:
        print(f"Login failed: {e}")
        return False

    # 2. Get Documents
    print("Fetching documents...")
    try:
        response = session.get(f"{BASE_URL}/api/v1/documents/", headers=headers)
        response.raise_for_status()
        documents = response.json()
        if not documents:
            print("No documents found to test.")
            # Create a document if none exist?
            return False
        
        doc_id = documents[0]["id"]
        doc_title = documents[0]["title"]
        print(f"Testing with document ID: {doc_id} ('{doc_title}')")
    except Exception as e:
        print(f"Failed to fetch documents: {e}")
        return False

    # 3. Download PDF
    print(f"Requesting PDF download for document {doc_id}...")
    try:
        url = f"{BASE_URL}/api/v1/documents/{doc_id}/download"
        params = {"format": "pdf"}
        response = session.get(url, headers=headers, params=params)
        
        if response.status_code != 200:
            print(f"Download failed with status {response.status_code}")
            print(response.text)
            return False
            
        content_type = response.headers.get("content-type", "")
        print(f"Response Content-Type: {content_type}")
        
        if "application/pdf" not in content_type:
             print("WARNING: Content-Type is not application/pdf")
             
        content = response.content
        if content.startswith(b"%PDF"):
            print("SUCCESS: Downloaded content is a valid PDF.")
            with open("test_output.pdf", "wb") as f:
                f.write(content)
            print("Saved to test_output.pdf")
            return True
        else:
            print("FAILURE: Downloaded content does not look like a PDF.")
            print(f"First 20 bytes: {content[:20]}")
            return False
            
    except Exception as e:
        print(f"Download request failed: {e}")
        return False

if __name__ == "__main__":
    if verify_pdf_export():
        sys.exit(0)
    else:
        sys.exit(1)
