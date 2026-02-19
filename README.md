# Legal Document Automation

Aplicación web full-stack para la automatización de documentos legales.

## Arquitectura

```mermaid
graph TD
    User[Usuario/Admin] --> Front[Frontend (React + TS + Tailwind)]
    Front --> API[Backend API (FastAPI)]
    API --> DB[(Database PostgreSQL)]
    API --> DocEngine[Motor de Documentos]
    DocEngine --> Word[Generador .docx (python-docx)]
    DocEngine --> PDF[Generador .pdf (reportlab)]
```

## Estructura del Proyecto

- **/backend**: Código fuente de la API (Python).
- **/frontend**: Interfaz de usuario (React).
- **/database**: Scripts de migración y configuración de BD.
- **/templates**: Plantillas base para documentos.
- **/docs**: Documentación adicional.

## Configuración Inicial

1. **Backend**:
   ```bash
   cd backend
   pip install -r requirements.txt
   uvicorn main:app --reload
   ```

2. **Frontend**:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

## Roles

- **Admin**: Crea y gestiona plantillas.
- **Usuario**: Genera documentos basados en plantillas existentes.
