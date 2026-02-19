from fastapi.testclient import TestClient
import sys
import traceback

# Add project root to path
sys.path.append("c:/Users/Usuario/Documents/Proyectos AUT/Automatización Documental/backend")

try:
    from main import app
    
    client = TestClient(app)

    def test_login():
        print("Attempting login via TestClient...")
        payload = {
            "username": "admin@example.com",
            "password": "admin"
        }
        try:
            response = client.post("/api/v1/login/access-token", data=payload)
            print(f"Status Code: {response.status_code}")
            print(f"Response: {response.text}")
        except Exception:
            traceback.print_exc()

    if __name__ == "__main__":
        test_login()

except Exception:
    traceback.print_exc()
