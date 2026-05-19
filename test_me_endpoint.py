import requests

token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3Nzk2MjgxMzIsInN1YiI6IjMifQ.l6_Qvz_bjYGrfwyxsEmgHd7dSuBlPs5pkOAUsNeJ8MI"
headers = {"Authorization": f"Bearer {token}"}
url = "http://localhost:8000/api/v1/users/me"

try:
    response = requests.get(url, headers=headers)
    print(f"Status Code: {response.status_code}")
    print(f"Response Body: {response.text}")
except Exception as e:
    print(f"Error: {e}")
