"""Test full flow: login, list documents, download."""
import requests

BASE = "http://localhost:8001/api/v1"

# 1. Login
r = requests.post(f"{BASE}/login/access-token", data={"username": "admin@example.com", "password": "admin123"})
print("Login:", r.status_code, r.json())
if r.status_code != 200:
    print("Login failed, aborting.")
    exit(1)

token = r.json()["access_token"]
headers = {"Authorization": f"Bearer {token}"}

# 2. List documents
r2 = requests.get(f"{BASE}/documents/", headers=headers)
print("Documents:", r2.status_code)
docs = r2.json()
for d in docs:
    print(f"  ID:{d['id']} Title:{d['title']} Path:{d.get('generated_file_path', 'N/A')}")

# 3. Download first doc
if docs:
    doc_id = docs[0]["id"]
    r3 = requests.get(f"{BASE}/documents/{doc_id}/download", headers=headers)
    if r3.ok:
        print(f"Download doc {doc_id}: {r3.status_code} content-type={r3.headers.get('content-type', '')}")
        print(f"  Content length: {len(r3.content)} bytes")
    else:
        print(f"Download doc {doc_id}: {r3.status_code} {r3.text}")
else:
    print("No documents to download. Creating one for test...")
    # Create a document
    r_templates = requests.get(f"{BASE}/templates/", headers=headers)
    print("Templates:", r_templates.status_code)
    templates = r_templates.json()
    if templates:
        template_id = templates[0]["id"]
        payload = {
            "title": "Test Document",
            "template_id": template_id,
            "variables": {"title": "Test", "date": "2026-02-16"}
        }
        r_create = requests.post(f"{BASE}/documents/", headers=headers, json=payload)
        print("Create doc:", r_create.status_code, r_create.json())
        if r_create.status_code == 200:
            new_doc_id = r_create.json()["id"]
            r3 = requests.get(f"{BASE}/documents/{new_doc_id}/download", headers=headers)
            if r3.ok:
                print(f"Download doc {new_doc_id}: {r3.status_code} OK ({len(r3.content)} bytes)")
            else:
                print(f"Download doc {new_doc_id}: {r3.status_code} {r3.text}")
    else:
        print("No templates available either. Cannot test download.")
