"""Quick script to reproduce the /documents 500 error."""
import os, sys
os.chdir(os.path.dirname(__file__))
sys.path.insert(0, ".")

from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

# Login
r = client.post("/api/v1/login/access-token", data={"username": "admin@example.com", "password": "admin"})
token = r.json()["access_token"]
print(f"Login OK, token: {token[:20]}...")

# GET /documents
r2 = client.get("/api/v1/documents", headers={"Authorization": f"Bearer {token}"})
print(f"Status: {r2.status_code}")
print(f"Body: {r2.text[:500]}")
