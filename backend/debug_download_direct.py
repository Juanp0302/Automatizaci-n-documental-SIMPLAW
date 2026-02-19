import os
import sys
from fastapi.responses import FileResponse
from fastapi.testclient import TestClient
from fastapi import FastAPI

app = FastAPI()

@app.get("/download/{filename}")
def download_file(filename: str):
    file_path = os.path.join("generated_docs", filename)
    print(f"Attempting to serve: {os.path.abspath(file_path)}")
    if not os.path.exists(file_path):
        return {"error": "File not found"}
    return FileResponse(file_path)

client = TestClient(app)

def test_download():
    # Ensure directory exists
    os.makedirs("generated_docs", exist_ok=True)
    # Create dummy file
    with open("generated_docs/test_debug.txt", "w") as f:
        f.write("test content")
    
    try:
        response = client.get("/download/test_debug.txt")
        print(f"Status: {response.status_code}")
        if response.status_code != 200:
            print(f"Response: {response.text}")
        else:
            print("Download successful")
    except Exception as e:
        print(f"Exception: {e}")

if __name__ == "__main__":
    test_download()
