# CHECKPOINT — Automatización Documental (SIMPLAW)
> Última actualización: 2026-04-01

---

## 🗂️ Arquitectura del Proyecto

```
Automatización Documental/
├── backend/                     # FastAPI + Python
│   ├── main.py                  # Entry point, CORS, exception handlers
│   ├── requirements.txt         # Dependencias Python
│   ├── Dockerfile               # Contenedor backend (LibreOffice + Python)
│   ├── sql_app.db               # Base de datos SQLite (persiste en volumen Docker)
│   ├── generated_docs/          # Documentos generados (persiste en volumen Docker)
│   ├── templates/               # Plantillas .docx subidas (persiste en volumen Docker)
│   └── app/
│       ├── api/api_v1/
│       │   ├── api.py           # Router principal
│       │   └── endpoints/
│       │       ├── documents.py # CRUD + generación + descarga + revisión IA
│       │       ├── templates.py # Upload/gestión de plantillas + análisis IA
│       │       ├── login.py     # Auth JWT
│       │       └── users.py     # Gestión usuarios
│       ├── core/config.py       # Settings (paths, CORS, DB URL)
│       ├── crud/                # CRUD operations (base.py con generics)
│       ├── db/                  # SQLAlchemy session + base
│       ├── models/              # SQLAlchemy models (User, Document, Template)
│       ├── schemas/             # Pydantic schemas
│       └── utils.py             # Lógica central de IA y manejo de documentos
│
├── frontend/                    # React + Vite
│   ├── src/
│   │   ├── App.jsx              # Rutas principales
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx    # Panel principal con stats
│   │   │   ├── Templates.jsx    # Gestión plantillas + upload + análisis IA
│   │   │   ├── TemplateConfig.jsx # Configuración avanzada de plantillas
│   │   │   ├── NewDocument.jsx  # Formulario crear documento
│   │   │   ├── Documents.jsx    # Lista documentos + descarga + revisión IA
│   │   │   ├── Statistics.jsx   # Dashboard de estadísticas
│   │   │   ├── Login.jsx        # Autenticación
│   │   │   ├── Profile.jsx      # Perfil usuario
│   │   │   └── Users.jsx        # Gestión usuarios (admin)
│   │   ├── api/                 # Axios clients (separados por entidad)
│   │   ├── components/          # Toast, Sidebar, NumberedElementsInput, etc.
│   │   └── context/             # Auth + Toast context
│   ├── .env                     # VITE_API_BASE_URL para desarrollo local
│   ├── .env.production          # VITE_API_BASE_URL → https://www.simplaw.co
│   └── Dockerfile               # Contenedor frontend (Nginx)
│
├── .github/workflows/deploy.yml # CI/CD: push a main → deploy automático a EC2
├── docker-compose.yml           # Orquestación local y en producción
├── .env.example                 # Variables de entorno requeridas
└── CHECKPOINT.md                # ← ESTE ARCHIVO
```

---

## 🚀 Cómo Iniciar los Servidores (Desarrollo Local)

### Backend (Puerto 8001)
```powershell
cd "c:\Users\Usuario\Documents\Proyectos AUT\Automatización Documental\backend"
..\venv\Scripts\activate
uvicorn main:app --reload --port 8001
```

### Frontend (Puerto 3000)
```powershell
cd "c:\Users\Usuario\Documents\Proyectos AUT\Automatización Documental\frontend"
npm run dev
```

### URLs Locales
- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8001
- **API Docs (Swagger):** http://localhost:8001/docs

### URLs de Producción
- **App:** https://www.simplaw.co/herramientas
- **Backend API:** https://www.simplaw.co/api/v1/

---

## ✅ Features Completadas

- [x] Autenticación JWT (login/registro)
- [x] Upload de plantillas .docx y .pdf
- [x] Extracción de variables `{{variable}}` de plantillas
- [x] Formulario dinámico para crear documentos
- [x] Generación de documentos (reemplazo de variables en .docx)
- [x] Descarga de documentos generados (.docx y .pdf)
- [x] Exportar a PDF (LibreOffice en producción / docx2pdf en Windows local)
- [x] Eliminación de documentos
- [x] Sistema de Toast notifications
- [x] UI responsive con diseño moderno
- [x] CORS configurado para múltiples orígenes
- [x] Exception handlers globales con logging
- [x] Preview del documento antes de generar (PDF)
- [x] Búsqueda y filtrado en página de documentos
- [x] Descripciones de plantillas
- [x] Elementos Numerados Dinámicos (listas de servicios con sub-campos y totales)
- [x] Dashboard de estadísticas
- [x] Gestión de usuarios (panel admin)
- [x] Análisis con IA para propuesta de variables (GPT-4o-mini)
- [x] Revisión de documentos con IA (corrección ortográfica + inconsistencias)
- [x] **Auto-Condicionador IA**: identifica bloques opcionales en plantillas e inyecta `{%p if %}` / `{%p endif %}` automáticamente (Jinja2-docxtpl)
- [x] Despliegue en producción (AWS EC2, Docker, Nginx, HTTPS)
- [x] Pipeline CI/CD (GitHub Actions → SSH → docker compose up --build)

---

## ⚠️ Problemas Conocidos y Soluciones

### 1. Error 500 al descargar documentos
**Causa:** Conflicto de `FileResponse` con caracteres especiales en rutas de Windows (ej. 'ó' en 'Automatización').
**Solución aplicada:** Se reemplazó `FileResponse` por `Response` estándar, leyendo el archivo en memoria antes de enviarlo.

### 2. Error de puerto ya en uso (local)
```powershell
taskkill /F /IM uvicorn.exe /IM python.exe
```

### 3. sql_app.db creado como directorio por Docker
**Causa:** Docker Compose crea el volumen como carpeta si el archivo no existe.
**Solución aplicada:** El script de deploy hace `touch backend/sql_app.db` antes de `docker compose up`.

### 4. Producción: templates no encontrados
**Causa:** `file_path` en DB no coincide con ubicación real dentro del contenedor.
**Solución:** `settings.TEMPLATES_DIR` apunta a `/app/templates` en el contenedor (configurado en `config.py`).

### 5. PDF en producción
**Causa:** Linux no tiene MS Word.
**Solución aplicada:** `convert_to_pdf()` en `utils.py` detecta el SO y usa LibreOffice en Linux, docx2pdf en Windows.

### 6. IA corregía totales matemáticos
**Causa:** El prompt de revisión IA recalculaba precios cuando detectaba inconsistencias.
**Solución aplicada:** Regla explícita en el prompt: "NO recalcular ni alterar sumas matemáticas o totales".

### 7. Auto-condicionador: templates bloqueadas
**Causa:** El proceso Word (en local) bloqueaba el archivo durante la inyección de condiciones.
**Solución:** En producción corre sobre Linux/LibreOffice sin bloqueos. En local, cerrar Word antes de usar la feature.

---

## 📋 Tareas Pendientes (Próximos Pasos)

### Alta Prioridad
- [ ] Configurar nueva instancia EC2 (la anterior fue reemplazada)
  - Actualizar secrets de GitHub Actions: `AWS_HOST` y `AWS_SSH_KEY`
  - Instalar Docker y Docker Compose en la nueva instancia
  - Configurar Nginx + SSL con Certbot
  - Restaurar archivos persistentes (sql_app.db, templates/, generated_docs/)

### Media Prioridad
- [ ] Tests automatizados (pytest con cobertura de endpoints principales)
- [ ] Versionado de documentos
- [ ] Mejoras al auto-condicionador: preview de qué bloques se marcarán antes de aplicar

### Baja Prioridad
- [ ] Multi-idioma
- [ ] Exportar estadísticas a Excel/CSV

---

## 🔄 Flujo de Deployment (CI/CD)

1. **Desarrollador** hace `git push origin main` desde local
2. **GitHub Actions** (`.github/workflows/deploy.yml`) se activa:
   - Conecta por SSH a la instancia EC2 (`secrets.AWS_HOST`, `secrets.AWS_SSH_KEY`)
   - Hace backup del `sql_app.db`
   - Ejecuta `git pull origin main`
   - Restaura el backup de BD
   - Ejecuta `docker compose down && docker compose up -d --build --force-recreate`
3. **Contenedores** en EC2 sirven la app en `https://www.simplaw.co`

### Secrets de GitHub Actions requeridos:
- `AWS_HOST` — IP pública de la instancia EC2
- `AWS_SSH_KEY` — Clave privada PEM (en formato OpenSSH, sin passphrase)

---

## 🔑 Variables de Entorno Requeridas

### Backend (`.env` en la raíz del proyecto en EC2)
```env
OPENAI_API_KEY=sk-...
SECRET_KEY=...
DATABASE_URL=sqlite:///sql_app.db
```

### Frontend
- Desarrollo: `frontend/.env` → `VITE_API_BASE_URL=http://localhost:8001`
- Producción: `frontend/.env.production` → `VITE_API_BASE_URL=https://www.simplaw.co`

---

## ⚡ Flujo de Generación de Documentos (Referencia Rápida)

1. **Frontend** (`NewDocument.jsx`): Usuario selecciona plantilla, llena variables, click "Generar"
2. **API call**: `POST /api/v1/documents/` con `{title, template_id, variables}`
3. **Backend** (`documents.py → create_document`):
   - Verifica que template existe en DB y en disco
   - Carga `.docx` con `docxtpl` (Jinja2)
   - Expande elementos numerados dinámicos (`expand_numbered_elements()`)
   - Renderiza variables, incluyendo condicionales `{%p if var %}`
   - Guarda en `backend/generated_docs/`
   - Crea registro en DB con `generated_file_path`
4. **Descarga**: `GET /api/v1/documents/{id}/download` → `Response` con bytes del archivo

### Archivos clave para debugging:
| Archivo | Responsabilidad |
|---------|-----------------|
| `backend/app/api/api_v1/endpoints/documents.py` | Generación, descarga, revisión IA |
| `backend/app/api/api_v1/endpoints/templates.py` | Upload, análisis IA, auto-condicionador |
| `backend/app/utils.py` | OpenAI calls, conversión PDF, inyección de condiciones |
| `backend/app/core/config.py` | Paths (GENERATED_DOCS_DIR, TEMPLATES_DIR) |
| `frontend/src/pages/NewDocument.jsx` | Formulario de creación (elementos dinámicos) |
| `frontend/src/pages/TemplateConfig.jsx` | Configuración avanzada + auto-condicionador UI |
| `frontend/src/pages/Documents.jsx` | Lista de documentos + botón revisión IA |

---

## 📅 Estado Actual de la Sesión
**Fecha:** 06/05/2026

### Contexto
- Se ha implementado la funcionalidad de **Prompt de Identificación** para Tipos Documentales en el módulo Extractor.
- Se han añadido campos de `description` y `aliases` a la configuración de los tipos documentales.
- Se resolvieron errores de validación (422) y crasheos de UI relacionados con el formato de los aliases.
- Los servidores están actualmente corriendo (Backend en 8000, Frontend en 3000).

### Próximos pasos inmediatos
1. Verificar la efectividad de las pistas de identificación en la clasificación real de documentos.
2. Continuar con la configuración de la nueva instancia EC2 si es necesario (según tareas pendientes previas).
3. Implementar tests automatizados para el flujo de extracción.
