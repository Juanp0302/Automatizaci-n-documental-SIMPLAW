import requests

# We need a token. Let's get one from the db if possible or use a known one.
# For local testing, we can bypass auth if we modify the backend temporarily, 
# but let's try to use the token from the logs if it's still valid.
token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3Nzc5OTIzMjcsInN1YiI6IjMifQ.OeJWGc8tmmkTgR45H7zGYQTTNEpGJK8e4nn-7iywcEI"

url = "http://localhost:8000/api/v1/extractor/projects/1/export?format=excel&filter=approved"
headers = {"Authorization": f"Bearer {token}"}

print(f"Requesting {url}...")
response = requests.get(url, headers=headers)

print(f"Status Code: {response.status_code}")
print(f"Headers: {response.headers}")

if response.status_code == 200:
    with open("test_export.xlsx", "wb") as f:
        f.write(response.content)
    print(f"Saved to test_export.xlsx. Size: {len(response.content)} bytes")
else:
    print(f"Error: {response.text}")
