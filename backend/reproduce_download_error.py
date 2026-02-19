import requests
import sys

def reproduce_error():
    base_url = "http://127.0.0.1:8000"
    
    # 1. Login
    print(f"Logging in to {base_url}...")
    try:
        login_res = requests.post(f"{base_url}/api/v1/login/access-token", data={
            "username": "admin@example.com",
            "password": "admin"
        })
        if login_res.status_code != 200:
            print(f"Login failed: {login_res.status_code} - {login_res.text}")
            return
    except Exception as e:
        print(f"Connection failed: {e}")
        return

    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print("Login successful.")

    # 2. List documents
    print("Fetching documents...")
    docs_res = requests.get(f"{base_url}/api/v1/documents/", headers=headers)
    if docs_res.status_code != 200:
        print(f"Failed to list documents: {docs_res.status_code} - {docs_res.text}")
        return

    docs = docs_res.json()
    if not docs:
        print("No documents found to download.")
        return

    # 3. Try download last document
    doc = docs[-1]
    print(f"Attempting to download Document ID: {doc['id']}, Path: {doc.get('generated_file_path')}")
    
    download_url = f"{base_url}/api/v1/documents/{doc['id']}/download"
    download_res = requests.get(download_url, headers=headers)
    
    if download_res.status_code == 200:
        print("Download SUCCESS!")
        print(f"Content-Length: {len(download_res.content)}")
    else:
        print(f"Download FAILED: {download_res.status_code}")
        print(f"Response: {download_res.text}")

if __name__ == "__main__":
    reproduce_error()
