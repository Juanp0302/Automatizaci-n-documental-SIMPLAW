import requests
import sys

def test_download_document():
    # 1. Login
    login_url = "http://127.0.0.1:8002/api/v1/login/access-token"
    login_payload = {
        "username": "admin@example.com",
        "password": "admin"
    }
    
    session = requests.Session()
    
    try:
        print("Logging in...")
        login_response = session.post(login_url, data=login_payload)
        if login_response.status_code != 200:
            print(f"Login failed: {login_response.text}")
            return
        
        token = login_response.json().get("access_token")
        headers = {"Authorization": f"Bearer {token}"}
        print("Login successful.")

        # 2. Get list of documents
        docs_url = "http://127.0.0.1:8002/api/v1/documents/"
        docs_res = session.get(docs_url, headers=headers)
        
        if docs_res.status_code != 200:
            print(f"Failed to get documents: {docs_res.status_code} - {docs_res.text}")
            return
            
        docs = docs_res.json()
        
        if not docs:
            print("No documents found. Please generate one first.")
            return

        doc_id = docs[0]["id"]
        print(f"Attempting to download document ID: {doc_id}")
        
        # 3. Download
        download_url = f"http://127.0.0.1:8002/api/v1/documents/{doc_id}/download"
        download_res = session.get(download_url, headers=headers)
        
        if download_res.status_code == 200:
            filename = f"downloaded_doc_{doc_id}.docx"
            with open(filename, "wb") as f:
                f.write(download_res.content)
            print(f"Download successful! Saved to {filename}")
        else:
             print(f"Download failed: {download_res.status_code} - {download_res.text}")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_download_document()
