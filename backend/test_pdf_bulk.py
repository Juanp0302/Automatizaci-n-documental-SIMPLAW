
import requests
import os

# Base URL
BASE_URL = "http://localhost:8001/api/v1"

# Login to get token
login_data = {
    "username": "admin@example.com",
    "password": "admin"
}

def test_pdf_bulk_download():
    print("Testing PDF bulk download...")
    
    # 1. Login
    response = requests.post(f"{BASE_URL}/login/access-token", data=login_data)
    if response.status_code != 200:
        print(f"Login failed: {response.text}")
        return
    
    token = response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # 2. Get some document IDs
    response = requests.get(f"{BASE_URL}/documents/", headers=headers)
    if response.status_code != 200:
        print(f"Failed to get documents: {response.text}")
        return
    
    documents = response.json()
    if not documents:
        print("No documents found.")
        return
    
    ids = [doc["id"] for doc in documents[:2]]
    print(f"Found {len(documents)} documents. Attempting to download IDs: {ids} as PDF")
    
    # 3. Call bulk-download with format=pdf
    payload = {"ids": ids, "format": "pdf"}
    response = requests.post(f"{BASE_URL}/documents/bulk-download", headers=headers, json=payload)
    
    if response.status_code == 200:
        print(f"Success! Received {len(response.content)} bytes.")
        content_disposition = response.headers.get('Content-Disposition', '')
        print(f"Content-Disposition: {content_disposition}")
        
        # Save to file
        filename = "test_bulk_pdf.zip"
        with open(filename, "wb") as f:
            f.write(response.content)
        print(f"ZIP saved to {filename}")
        
        # Verify ZIP contents
        import zipfile
        with zipfile.ZipFile(filename, 'r') as z:
            print(f"ZIP Contents: {z.namelist()}")
            if any(name.endswith(".pdf") for name in z.namelist()):
                print("Verified: ZIP contains PDF files.")
            else:
                print("Error: ZIP DOES NOT contain PDF files.")
            
    else:
        print(f"PDF bulk download failed with status {response.status_code}: {response.text}")

if __name__ == "__main__":
    test_pdf_bulk_download()
