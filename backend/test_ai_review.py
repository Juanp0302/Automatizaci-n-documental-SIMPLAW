import requests
import json

BASE = 'http://localhost:8001/api/v1'

# 1. Login
r = requests.post(f'{BASE}/login/access-token', data={'username':'contacto@simplaw.co','password':'Simplaw2026!'})
token = r.json().get('access_token')
print('Token OK:', bool(token))

headers = {'Authorization': f'Bearer {token}'}

# 2. Obtener templates
r = requests.get(f'{BASE}/templates/', headers=headers)
templates = r.json()
print('Plantillas disponibles:', [t['title'] for t in templates])

if not templates:
    print('No hay plantillas')
    exit()

# Usar la primera plantilla .docx (no PDF)
tmpl = next((t for t in templates if str(t.get('file_path','')).endswith('.docx')), templates[0])
print(f"Usando: {tmpl['title']} (id={tmpl['id']})")

# 3. Generar documento con la revision IA
payload = {
    'title': 'Test Revision IA',
    'template_id': tmpl['id'],
    'variables': {
        'nombre_cliente': 'Juan Perez',
        'fecha': '2026-03-12',
        'cedula': '12345678',
        'valor': '5000000'
    },
    'parent_id': None
}
print('Generando documento (esto puede tardar 15-30s por la revision IA)...')
r = requests.post(f'{BASE}/documents/', json=payload, headers=headers, timeout=120)
print('Status HTTP:', r.status_code)

if r.status_code == 200:
    doc = r.json()
    print('Doc ID:', doc.get('id'))
    print('ai_review_summary:', doc.get('ai_review_summary'))
    print('EXITO: La feature funciona correctamente')
else:
    print('ERROR:', r.text[:500])
