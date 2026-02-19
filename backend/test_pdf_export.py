import requests
import sys

BASE_URL = "http://127.0.0.1:8000/api/v1"

def login():
    url = f"{BASE_URL}/login/access-token"
    payload = {
        "username": "admin@example.com",
        "password": "admin"
    }
    try:
        resp = requests.post(url, data=payload)
        resp.raise_for_status()
        return resp.json()["access_token"]
    except Exception as e:
        print(f"Login failed: {e}")
        sys.exit(1)

def get_first_document(headers):
    url = f"{BASE_URL}/documents/"
    resp = requests.get(url, headers=headers)
    resp.raise_for_status()
    docs = resp.json()
    if not docs:
        print("No documents found to test download.")
        return None
    return docs[0]

def test_pdf_download(doc_id, headers):
    url = f"{BASE_URL}/documents/{doc_id}/download?format=pdf"
    print(f"Testing download for doc {doc_id} as PDF...")
    
    try:
        resp = requests.get(url, headers=headers)
        if resp.status_code != 200:
            print(f"FAILED: Status code {resp.status_code}")
            print(resp.text)
            return False
            
        content_type = resp.headers.get("Content-Type")
        print(f"Content-Type: {content_type}")
        
        if "application/pdf" not in content_type:
            print("FAILED: Content-Type is not application/pdf")
            return False
            
        # Check magic bytes for PDF
        if resp.content.startswith(b"%PDF-"):
            print("SUCCESS: File magic bytes confirm it is a PDF.")
            # Save it to verify manually if needed
            with open(f"test_doc_{doc_id}.pdf", "wb") as f:
                f.write(resp.content)
            print(f"Saved to test_doc_{doc_id}.pdf")
            return True
        else:
            print("FAILED: File content does not look like a PDF.")
            print(f"First 20 bytes: {resp.content[:20]}")
            return False
            
    except Exception as e:
        print(f"Exception during download: {e}")
        return False

if __name__ == "__main__":
    token = login()
    headers = {"Authorization": f"Bearer {token}"}
    
    doc = get_first_document(headers)
    if doc:
        success = test_pdf_download(doc["id"], headers)
        if success:
            sys.exit(0)
        else:
            sys.exit(1)
    else:
        print("Skipping download test (no docs).")
