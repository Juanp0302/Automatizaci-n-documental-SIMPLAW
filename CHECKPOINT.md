# 🔖 CHECKPOINT — Automatización Documental

> **Última actualización:** 2026-02-17 (Sesión reanudada - Servidores Reiniciados)
> **Estado general:** Funcional. Backend (8001) y Frontend (5173/3000) activos.

---

## 📦 Arquitectura del Proyecto

```
Automatización Documental/
├── backend/                    # FastAPI (Python)
│   ├── main.py                 # Entry point, CORS, exception handlers
│   ├── app/
│   │   ├── api/api_v1/
│   │   │   ├── api.py          # Router principal
│   │   │   └── endpoints/
│   │   │       ├── documents.py  # CRUD + generación + descarga docs
│   │   │       ├── templates.py  # Upload/gestión de plantillas
│   │   │       ├── login.py      # Auth JWT
│   │   │       └── users.py      # Gestión usuarios
│   │   ├── core/config.py      # Settings (paths, CORS, DB URL)
│   │   ├── crud/               # CRUD operations
│   │   ├── db/                 # SQLAlchemy session + base
│   │   ├── models/             # SQLAlchemy models (User, Document, Template)
│   │   ├── schemas/            # Pydantic schemas
│   │   └── utils.py            # extract_variables_from_docx()
│   ├── templates/              # Plantillas .docx subidas
│   ├── generated_docs/         # Documentos generados
│   └── sql_app.db              # SQLite database
├── frontend/                   # React + Vite
│   ├── src/
│   │   ├── App.jsx             # Rutas principales
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx   # Panel principal
│   │   │   ├── Templates.jsx   # Gestión plantillas
│   │   │   ├── NewDocument.jsx # Formulario crear documento
│   │   │   ├── Documents.jsx   # Lista documentos + descarga
│   │   │   ├── Login.jsx       # Autenticación
│   │   │   └── Profile.jsx     # Perfil usuario
│   │   ├── api/                # Axios clients
│   │   ├── components/         # Toast, Sidebar, etc.
│   │   └── context/            # Auth + Toast context
│   └── package.json
└── CHECKPOINT.md               # ← ESTE ARCHIVO
```

---

## 🚀 Cómo Iniciar los Servidores

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

### URLs
- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8001
- **API Docs:** http://localhost:8001/docs

---

## ✅ Features Completados

- [x] Autenticación JWT (login/registro)
- [x] Upload de plantillas .docx
- [x] Extracción de variables {{variable}} de plantillas
- [x] Formulario para crear documentos con variables
- [x] Generación de documentos (reemplazo de variables en .docx)
- [x] Descarga de documentos generados
- [x] Exportar a PDF
- [x] Eliminación de documentos
- [x] Sistema de Toast notifications
- [x] UI responsive con diseño moderno
- [x] CORS configurado para puertos múltiples
- [x] Exception handlers globales con logging
- [x] Preview del documento antes de generar (PDF)

---

## 🔧 Problemas Conocidos y Soluciones

### 1. Error 500 al descargar documentos
**Causa:** Conflicto de `FileResponse` (streaming async) con caracteres especiales en rutas de Windows (ej: 'ó' en 'Automatización').
**Solución aplicada:** Se reemplazó `FileResponse` por `Response` estándar, leyendo el archivo en memoria antes de enviarlo. (Fix aplicado en `documents.py`).

### 2. Error de puerto ya en uso
**Causa:** Instancia anterior del servidor no fue cerrada
**Solución:** Matar el proceso:
```powershell
taskkill /F /IM uvicorn.exe /IM python.exe
```

### 3. Base de datos no encontrada  
**Causa:** `DATABASE_URL` apuntaba a path incorrecto
**Solución aplicada:** `config.py` resuelve `BASE_DIR` dinámicamente desde `__file__`

### 4. Templates no encontrados
**Causa:** `file_path` en DB no coincide con ubicación real
**Solución:** Verificar que `settings.TEMPLATES_DIR` apunta a `backend/templates/`

### 5. Fallo en exportación a PDF
**Causa:** Servidor ejecutándose en entorno global sin dependencia `docx2pdf` o proceso Word bloqueado.
**Solución:** Ejecutar servidor usando venv explícito: `& "..\venv\Scripts\python.exe" -m uvicorn ...` y asegurar que Word esté instalado.

### 6. Error 10048 (Puerto en uso) y 500 en Preview
**Causa:** Procesos zombis ocupando el puerto 8000 y problemas de threading con COM (Word) en uvicorn.
**Solución Aplicada:**
- Se cambió el puerto del Backend a **8001**.
- Se inicializó COM explícitamente (`pythoncom.CoInitialize()`) en la función de conversión a PDF.

---

## 📋 Tareas Pendientes (Próximos Pasos)

### Alta Prioridad
- [x] Búsqueda y filtrado en página de documentos
- [x] Descripciones de plantillas
- [x] Mejorar lógica de reemplazo de variables (preservar formato Word)
- [ ] Tests automatizados

### Media Prioridad
- [ ] Versionado de documentos
- [ ] Tests automatizados
- [ ] Despliegue a producción

### Baja Prioridad
- [ ] Multi-idioma

---

## 📝 Estado Actual de la Sesión
**Fecha:** 19/02/2026 (Sesión Reanudada - 10:20)

### Resumen
Se ha completado el flujo de reanudación del proyecto.
- **Backend:** Activo en puerto **8001** (Verificado).
- **Frontend:** Activo en puerto **3000** (Reiniciado vía cmd).
- **Verificación:** Servidores escuchando correctamente.

### Próximos Pasos
- **Desarrollo:** Proceder con tareas pendientes (Tests automatizados, Versionado).
- **Frontend:** Verificar la UI en http://localhost:3000.

---

## 🛠 Flujo de Generación de Documentos (Referencia Rápida)

1. **Frontend** (`NewDocument.jsx`): Usuario selecciona plantilla, llena variables, click "Generar"
2. **API call**: `POST /api/v1/documents/` con `{title, template_id, variables}`
3. **Backend** (`documents.py:create_document`):
   - Verifica que template existe en DB y en disco
   - Carga template.docx con `python-docx`
   - Reemplaza `{{variable}}` en párrafos y tablas
   - Guarda en `backend/generated_docs/`
   - Crea registro en DB con `generated_file_path`
4. **Descarga**: `GET /api/v1/documents/{id}/download` → `FileResponse`

### Archivos clave para debugging de generación:
- `backend/app/api/api_v1/endpoints/documents.py` — Lógica de generación
- `backend/app/utils.py` — Extracción de variables
- `backend/app/core/config.py` — Paths (GENERATED_DOCS_DIR, TEMPLATES_DIR)
- `frontend/src/pages/NewDocument.jsx` — Formulario
- `frontend/src/pages/Documents.jsx` — Lista + descarga
- `frontend/src/api/documents.js` — API client
