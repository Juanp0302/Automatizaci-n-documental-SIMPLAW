---
description: Resume work on the Automatización Documental project after a conversation reset
---

# Resume Project Workflow

// turbo-all

Follow these steps in order to quickly resume work without starting from scratch:

## 1. Read the Checkpoint File
Read `CHECKPOINT.md` at the project root to understand:
- Current project architecture and file locations
- Known issues and their solutions
- What was being worked on last
- Pending tasks

```powershell
cat "c:\Users\Usuario\Documents\Proyectos AUT\Automatización Documental\CHECKPOINT.md"
```

## 2. Check Server Status
Verify if servers are running before doing anything else.

```powershell
netstat -ano | findstr ":8000 :5173"
```

## 3. Start Backend (if not running)
```powershell
cd "c:\Users\Usuario\Documents\Proyectos AUT\Automatización Documental\backend"
..\venv\Scripts\activate; uvicorn main:app --reload --port 8000
```

## 4. Start Frontend (if not running)
```powershell
cd "c:\Users\Usuario\Documents\Proyectos AUT\Automatización Documental\frontend"
npm run dev
```

## 5. Verify Backend Health
```powershell
curl http://localhost:8000/docs -UseBasicParsing | Select-Object -ExpandProperty StatusCode
```

## 6. Update Checkpoint
After completing work, update the "Estado Actual de la Sesión" section in `CHECKPOINT.md` with:
- What was worked on
- What was accomplished
- Any new errors found

## Key Files for Document Generation Debugging
If resuming document generation work, focus on these files:
- `backend/app/api/api_v1/endpoints/documents.py` — Generation + download logic
- `backend/app/utils.py` — Variable extraction from .docx
- `backend/app/core/config.py` — Path configuration
- `frontend/src/pages/NewDocument.jsx` — Document creation form
- `frontend/src/pages/Documents.jsx` — Document list + download
