
import requests
import sys
import os

# Add backend to path just in case we need to import app manually
sys.path.append(os.getcwd())

def check_health():
    ports = [8000, 8001, 8002]
    for port in ports:
        print(f"Checking port {port}...")
        try:
            response = requests.get(f"http://localhost:{port}/api/v1/templates/")
            print(f"Port {port} Status Code: {response.status_code}")
            if response.status_code == 200:
                 print(f"Port {port} Response (first 100 chars): {response.text[:100]}")
            else:
                 print(f"Port {port} Error Response: {response.text}")
        except Exception as e:
            print(f"Port {port} check failed: {e}")

if __name__ == "__main__":
    check_health()
