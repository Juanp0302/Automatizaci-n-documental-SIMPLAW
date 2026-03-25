import requests
import json
import os

BASE = "https://simplaw.co/api/v1"

# Login
r = requests.post(f'{BASE}/login/access-token', data={'username':'contacto@simplaw.co','password':'Simplaw2026!'})
token = r.json().get('access_token')
print('Token OK:', bool(token))
headers = {'Authorization': f'Bearer {token}'}

# Obtener templates
r = requests.get(f'{BASE}/templates/', headers=headers)
templates = r.json()
tmpl = templates[0]
tid = tmpl['id']
print(f"Template: {tmpl['title']} (id={tid})")

# Test 1: variable-groups
print('\n--- GET /variable-groups ---')
r = requests.get(f'{BASE}/templates/{tid}/variable-groups', headers=headers)
print('Status:', r.status_code)
try:
    print('Response:', r.json())
except:
    print('Raw:', r.text[:500])

# Test 2: analyze-ai
print('\n--- POST /analyze-ai ---')
r = requests.post(f'{BASE}/templates/{tid}/analyze-ai', json={'user_prompt': ''}, headers=headers, timeout=60)
print('Status:', r.status_code)
try:
    data = r.json()
    print('simple count:', len(data.get('simple', [])))
    print('groups count:', len(data.get('groups', [])))
except:
    print('Raw:', r.text[:500])
