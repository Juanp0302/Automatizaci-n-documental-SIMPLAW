import requests
import sys

def test_endpoint():
    url = "http://127.0.0.1:8001/api/v1/extractor/utils/select-folder"
    # We need a token. I'll try to get one from the logs or use a test one if I can.
    # Actually, I can check if the endpoint is protected.
    # Yes, it uses Depends(deps.get_current_extractor_user).
    
    print(f"Testing endpoint {url} (without token, should get 401)")
    try:
        r = requests.get(url, timeout=5)
        print(f"Status: {r.status_code}")
        print(f"Response: {r.text}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_endpoint()
