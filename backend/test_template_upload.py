
import requests

def test_create_template():
    url = "http://127.0.0.1:8000/api/v1/templates/"
    
    # Authenticate first (we need a token for admin actions? endpoint says Depends(deps.get_current_active_superuser))
    # Let's get a token first
    login_url = "http://127.0.0.1:8000/api/v1/login/access-token"
    login_payload = {
        "username": "admin@example.com",
        "password": "admin"
    }
    try:
        login_resp = requests.post(login_url, data=login_payload)
        login_resp.raise_for_status()
        token = login_resp.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        print("Login successful, token obtained.")
    except Exception as e:
        print(f"Login failed: {e}")
        return

    # Create a dummy file
    with open("test_doc.docx", "wb") as f:
        f.write(b"Dummy content")

    # Upload
    files = {'file': ('test_doc.docx', open('test_doc.docx', 'rb'), 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')}
    data = {'title': 'Test Template'}

    try:
        response = requests.post(url, headers=headers, files=files, data=data)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
    except Exception as e:
        print(f"Upload failed: {e}")

if __name__ == "__main__":
    test_create_template()
