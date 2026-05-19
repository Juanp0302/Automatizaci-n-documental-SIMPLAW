import os
import shutil
import uuid
import logging
from typing import List, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, BackgroundTasks, Query, Header
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from app.api import deps
from app.models.extractor import (
    ExtractorProject, DocType, DocField, ExtractedDocument, 
    DocumentFieldValue, ExtractionRule, ExtractionAlert, ExtractorSetting
)
from app.schemas import extractor as schemas
from app.services.ai.ocr_service import ocr_service
from app.services.ai.classifier import classifier_service
from app.services.ai.extractor import extractor_service
from app.services.ai.rules_engine import rules_engine
from app.services.ai.excel_export import (
    export_project_to_excel, 
    export_project_to_csv, 
    export_project_to_json
)
from app.core.config import settings

router = APIRouter()
logger = logging.getLogger(__name__)

# --- Projects ---

@router.get("/projects", response_model=List[schemas.ExtractorProject])
def read_projects(
    db: Session = Depends(deps.get_db),
    current_user = Depends(deps.get_current_extractor_user),
) -> Any:
    return db.query(ExtractorProject).filter(ExtractorProject.owner_id == current_user.id).all()

@router.post("/projects", response_model=schemas.ExtractorProject)
def create_project(
    *,
    db: Session = Depends(deps.get_db),
    project_in: schemas.ExtractorProjectCreate,
    current_user = Depends(deps.get_current_extractor_user),
) -> Any:
    project = ExtractorProject(
        **project_in.model_dump(),
        owner_id=current_user.id
    )
    db.add(project)
    db.commit()
    db.refresh(project)
    return project

@router.get("/projects/{id}", response_model=schemas.ExtractorProject)
def read_project(
    id: int,
    db: Session = Depends(deps.get_db),
    current_user = Depends(deps.get_current_extractor_user),
) -> Any:
    project = db.query(ExtractorProject).filter(ExtractorProject.id == id, ExtractorProject.owner_id == current_user.id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project

# --- Document Types & Fields ---

@router.get("/projects/{id}/types", response_model=List[schemas.DocType])
def read_project_types(
    id: int,
    db: Session = Depends(deps.get_db),
    current_user = Depends(deps.get_current_extractor_user),
) -> Any:
    return db.query(DocType).filter(DocType.project_id == id).order_by(DocType.sort_order).all()

@router.post("/projects/{id}/types", response_model=schemas.DocType)
def create_doc_type(
    id: int,
    type_in: schemas.DocTypeBase,
    db: Session = Depends(deps.get_db),
    current_user = Depends(deps.get_current_extractor_user),
) -> Any:
    doc_type = DocType(**type_in.model_dump(), project_id=id)
    db.add(doc_type)
    db.commit()
    db.refresh(doc_type)
    return doc_type

@router.put("/types/{id}", response_model=schemas.DocType)
def update_doc_type(
    id: int,
    type_in: schemas.DocTypeBase,
    db: Session = Depends(deps.get_db),
    current_user = Depends(deps.get_current_extractor_user),
) -> Any:
    doc_type = db.query(DocType).filter(DocType.id == id).first()
    if not doc_type:
        raise HTTPException(status_code=404, detail="DocType not found")
    
    update_data = type_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(doc_type, key, value)
    
    db.add(doc_type)
    db.commit()
    db.refresh(doc_type)
    return doc_type

@router.delete("/types/{id}")
def delete_doc_type(
    id: int,
    db: Session = Depends(deps.get_db),
    current_user = Depends(deps.get_current_extractor_user),
) -> Any:
    doc_type = db.query(DocType).filter(DocType.id == id).first()
    if not doc_type:
        raise HTTPException(status_code=404, detail="DocType not found")
    
    db.delete(doc_type)
    db.commit()
    return {"message": "DocType deleted"}

@router.get("/types/{id}/fields", response_model=List[schemas.DocField])
def read_type_fields(
    id: int,
    db: Session = Depends(deps.get_db),
    current_user = Depends(deps.get_current_extractor_user),
) -> Any:
    return db.query(DocField).filter(DocField.doc_type_id == id).all()

@router.get("/projects/{id}/fields", response_model=List[schemas.DocField])
def read_project_fields(
    id: int,
    db: Session = Depends(deps.get_db),
    current_user = Depends(deps.get_current_extractor_user),
) -> Any:
    # Get all fields from all types in the project
    return db.query(DocField).join(DocType).filter(DocType.project_id == id).all()

@router.post("/types/{id}/fields")
def save_doc_fields(
    id: int,
    fields_in: List[schemas.DocFieldBase],
    db: Session = Depends(deps.get_db),
    current_user = Depends(deps.get_current_extractor_user),
) -> Any:
    # Remove existing fields
    db.query(DocField).filter(DocField.doc_type_id == id).delete()
    
    # Add new fields
    for field_data in fields_in:
        field = DocField(**field_data.model_dump(), doc_type_id=id)
        db.add(field)
    
    db.commit()
    return {"message": f"{len(fields_in)} fields saved"}

# --- Processing Logic (The "Arrollado") ---

async def process_document_task(db_session_factory, doc_id: int, project_id: int):
    # Usamos una sesión fresca para el background task
    db = db_session_factory()
    try:
        doc = db.query(ExtractedDocument).filter(ExtractedDocument.id == doc_id).first()
        project = db.query(ExtractorProject).filter(ExtractorProject.id == project_id).first()
        if not doc or not project:
            return

        doc.status = "processing"
        db.commit()

        # 1. OCR
        ocr_result = await ocr_service.get_text(db, doc.file_path)
        doc.ocr_text = ocr_result["text"]
        doc.page_count = ocr_result["page_count"]
        doc.ocr_provider = ocr_result["provider"]
        db.commit()

        # 2. Classification
        doc_types = db.query(DocType).filter(DocType.project_id == project_id).order_by(DocType.sort_order).all()
        if doc_types:
            type_id, conf = await classifier_service.classify(
                db, doc.ocr_text, doc_types, 
                project.connector_llm, project.llm_classify_model
            )
            doc.doc_type_id = type_id
            doc.classification_confidence = conf
            db.commit()

        # 3. Extraction
        if doc.doc_type_id:
            fields = db.query(DocField).filter(DocField.doc_type_id == doc.doc_type_id).all()
            if fields:
                doc_type = db.query(DocType).filter(DocType.id == doc.doc_type_id).first()
                extracted_data = await extractor_service.extract_fields(
                    db, doc.ocr_text, fields, doc_type,
                    project.connector_llm, project.llm_extract_model
                )
                
                # Guardar valores
                for item in extracted_data:
                    val = DocumentFieldValue(
                        document_id=doc.id,
                        field_id=item["field_id"],
                        field_name=item["field_name"],
                        field_label=item["field_label"],
                        raw_value=item["raw_value"],
                        normalized_value=item["raw_value"], # Por ahora igual
                        confidence=item["confidence"],
                        source_text=item["source_text"]
                    )
                    db.add(val)
                db.commit()

        # 4. Rules Engine
        try:
            await rules_engine.apply_rules(db, doc.id)
        except Exception as re_err:
            logger.error(f"Error applying rules: {re_err}")
        # Refresh doc to get field values
        db.refresh(doc)
        
        # Determine if everything is high confidence
        is_high_confidence = True
        threshold = project.confidence_threshold or 0.8
        
        if doc.classification_confidence and doc.classification_confidence < threshold:
            is_high_confidence = False
        
        if doc.field_values:
            for val in doc.field_values:
                if val.confidence and val.confidence < threshold:
                    is_high_confidence = False
                    break
        else:
            # If no fields were extracted but were expected, maybe it needs review
            is_high_confidence = False

        if is_high_confidence:
            doc.review_status = "approved"
        else:
            doc.review_status = "pending"

        doc.status = "completed"
        db.commit()

    except Exception as e:
        logger.error(f"Error processing document {doc_id}: {e}")
        doc.status = "error"
        doc.error_message = str(e)
        db.commit()
    finally:
        db.close()

@router.post("/projects/{id}/upload")
async def upload_documents(
    id: int,
    background_tasks: BackgroundTasks,
    files: List[UploadFile] = File(...),
    db: Session = Depends(deps.get_db),
    current_user = Depends(deps.get_current_extractor_user),
) -> Any:
    project = db.query(ExtractorProject).filter(ExtractorProject.id == id, ExtractorProject.owner_id == current_user.id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    upload_dir = os.path.join(settings.BASE_DIR, "uploads", str(id))
    os.makedirs(upload_dir, exist_ok=True)

    docs_created = []
    for file in files:
        file_id = str(uuid.uuid4())
        ext = os.path.splitext(file.filename)[1]
        saved_name = f"{file_id}{ext}"
        file_path = os.path.join(upload_dir, saved_name)
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        doc = ExtractedDocument(
            project_id=id,
            file_path=file_path,
            file_name=file.filename,
            file_ext=ext,
            file_size=os.path.getsize(file_path),
            status="pending"
        )
        db.add(doc)
        db.commit()
        db.refresh(doc)
        docs_created.append(doc)

        # Encolar procesamiento
        background_tasks.add_task(process_document_task, deps.SessionLocal, doc.id, id)

    return {"message": f"{len(docs_created)} files uploaded and queued for processing", "ids": [d.id for d in docs_created]}

# --- Results ---

@router.put("/projects/{id}", response_model=schemas.ExtractorProject)
def update_project(
    id: int,
    project_in: schemas.ExtractorProjectUpdate,
    db: Session = Depends(deps.get_db),
    current_user = Depends(deps.get_current_extractor_user),
) -> Any:
    project = db.query(ExtractorProject).filter(ExtractorProject.id == id, ExtractorProject.owner_id == current_user.id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    update_data = project_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(project, key, value)
    
    db.add(project)
    db.commit()
    db.refresh(project)
    return project

@router.post("/projects/{id}/process-folder")
async def process_project_folder(
    id: int,
    background_tasks: BackgroundTasks,
    db: Session = Depends(deps.get_db),
    current_user = Depends(deps.get_current_extractor_user),
) -> Any:
    project = db.query(ExtractorProject).filter(ExtractorProject.id == id, ExtractorProject.owner_id == current_user.id).first()
    if not project or not project.root_folder:
        raise HTTPException(status_code=404, detail="Project or folder not found")

    # Escanear archivos en la carpeta de forma recursiva
    import glob
    files = []
    # Usar patrones que capturen tanto minúsculas como mayúsculas si es posible, 
    # o simplemente listar ambos. En Windows glob no suele ser case-sensitive por defecto,
    # pero para portabilidad es mejor ser explícito o usar un enfoque más robusto.
    patterns = ['**/*.pdf', '**/*.jpg', '**/*.jpeg', '**/*.png', '**/*.PDF', '**/*.JPG', '**/*.JPEG', '**/*.PNG']
    for pattern in patterns:
        full_pattern = os.path.join(project.root_folder, pattern)
        files.extend(glob.glob(full_pattern, recursive=True))

    docs_created = []
    for file_path in files:
        # Evitar duplicados (por ruta)
        existing = db.query(ExtractedDocument).filter(ExtractedDocument.file_path == file_path, ExtractedDocument.project_id == id).first()
        if existing:
            continue

        doc = ExtractedDocument(
            project_id=id,
            file_path=file_path,
            file_name=os.path.basename(file_path),
            file_ext=os.path.splitext(file_path)[1],
            file_size=os.path.getsize(file_path),
            status="pending",
            review_status="none"
        )
        db.add(doc)
        db.commit()
        db.refresh(doc)
        docs_created.append(doc)
        background_tasks.add_task(process_document_task, deps.SessionLocal, doc.id, id)

    return {"message": f"Started processing {len(docs_created)} new files", "count": len(docs_created)}

# --- Results & Review ---

@router.put("/documents/{doc_id}/review", response_model=schemas.ExtractedDocument)
def review_document(
    doc_id: int,
    review_in: schemas.DocumentReviewUpdate,
    db: Session = Depends(deps.get_db),
    current_user = Depends(deps.get_current_extractor_user),
) -> Any:
    doc = db.query(ExtractedDocument).filter(ExtractedDocument.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    status = review_in.status
    if status not in ["approved", "rejected", "pending"]:
        raise HTTPException(status_code=400, detail="Invalid review status")
    
    doc.review_status = status
    db.commit()
    db.refresh(doc)
    return doc

@router.get("/projects/{id}/documents", response_model=List[schemas.ExtractedDocument])
def read_project_documents(
    id: int,
    db: Session = Depends(deps.get_db),
    current_user = Depends(deps.get_current_extractor_user),
) -> Any:
    return db.query(ExtractedDocument).filter(ExtractedDocument.project_id == id).all()

@router.get("/projects/{id}/export")
def export_project(
    id: int,
    format: str = Query("excel"),
    filter: str = Query("approved"),
    db: Session = Depends(deps.get_db),
    current_user = Depends(deps.get_current_extractor_user),
) -> Any:
    """Export via authenticated API call (axios with Bearer token)."""
    return _do_export(db, id, format, filter)


@router.get("/projects/{id}/download")
def download_project(
    id: int,
    format: str = Query("excel"),
    filter: str = Query("approved"),
    token: str = Query(...),
    db: Session = Depends(deps.get_db),
) -> Any:
    """Direct browser download via token in query string (no OAuth2 header needed)."""
    from jose import jwt as jose_jwt, JWTError
    from pydantic import ValidationError
    from app.core import security as core_security
    from app.schemas.token import TokenPayload as TP
    from app.models.user import User as UserModel
    
    try:
        payload = jose_jwt.decode(token, settings.SECRET_KEY, algorithms=[core_security.ALGORITHM])
        token_data = TP(**payload)
    except (JWTError, ValidationError):
        raise HTTPException(status_code=401, detail="Invalid token")
        
    user = db.query(UserModel).filter(UserModel.id == token_data.sub).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
        
    # Check extractor access
    if not user.has_extractor_access and not user.is_superuser:
        raise HTTPException(status_code=403, detail="User does not have access to the Extractor module")
    
    return _do_export(db, id, format, filter)


def _do_export(db: Session, project_id: int, format: str, filter: str):
    """Shared export logic used by both endpoints."""
    project = db.query(ExtractorProject).filter(ExtractorProject.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    if format == "excel":
        file_data = export_project_to_excel(db, project_id, filter)
        media_type = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        ext = "xlsx"
    elif format == "csv":
        file_data = export_project_to_csv(db, project_id, filter)
        media_type = "text/csv"
        ext = "csv"
    elif format == "json":
        file_data = export_project_to_json(db, project_id, filter)
        media_type = "application/json"
        ext = "json"
    else:
        raise HTTPException(status_code=400, detail="Unsupported format")

    from urllib.parse import quote
    filename = f"reporte_simplaw_{project_id}.{ext}"
    
    from fastapi import Response
    content = file_data.getvalue()
    
    # Safe filename for Content-Disposition (RFC 6266)
    encoded_filename = quote(filename)
    
    logger.info(f"EXPORT INICIADO: Proyecto={project_id}, Formato={format}, Tamaño={len(content)} bytes")
    
    return Response(
        content=content,
        media_type=media_type,
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"; filename*=UTF-8\'\'{encoded_filename}',
            "Content-Length": str(len(content)),
            "Access-Control-Expose-Headers": "Content-Disposition, Content-Length"
        }
    )

@router.get("/documents/{doc_id}", response_model=schemas.ExtractedDocument)
def read_document_detail(
    doc_id: int,
    db: Session = Depends(deps.get_db),
    current_user = Depends(deps.get_current_extractor_user),
) -> Any:
    doc = db.query(ExtractedDocument).filter(ExtractedDocument.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return doc

# --- Rules ---
@router.get("/projects/{project_id}/rules", response_model=List[schemas.ExtractionRule])
def read_rules(
    project_id: int,
    db: Session = Depends(deps.get_db),
    current_user = Depends(deps.get_current_extractor_user),
) -> Any:
    return db.query(ExtractionRule).filter(ExtractionRule.project_id == project_id).all()

@router.post("/projects/{project_id}/rules", response_model=schemas.ExtractionRule)
def create_rule(
    project_id: int,
    rule_in: schemas.ExtractionRuleCreate,
    db: Session = Depends(deps.get_db),
    current_user = Depends(deps.get_current_extractor_user),
) -> Any:
    rule = ExtractionRule(project_id=project_id, **rule_in.model_dump())
    db.add(rule)
    db.commit()
    db.refresh(rule)
    return rule

@router.put("/rules/{rule_id}", response_model=schemas.ExtractionRule)
def update_rule(
    rule_id: int,
    rule_in: schemas.ExtractionRuleUpdate,
    db: Session = Depends(deps.get_db),
    current_user = Depends(deps.get_current_extractor_user),
) -> Any:
    rule = db.query(ExtractionRule).filter(ExtractionRule.id == rule_id).first()
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")
    
    update_data = rule_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(rule, field, value)
    
    db.add(rule)
    db.commit()
    db.refresh(rule)
    return rule

@router.delete("/rules/{rule_id}")
def delete_rule(
    rule_id: int,
    db: Session = Depends(deps.get_db),
    current_user = Depends(deps.get_current_extractor_user),
) -> Any:
    rule = db.query(ExtractionRule).filter(ExtractionRule.id == rule_id).first()
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")
    db.delete(rule)
    db.commit()
    return {"status": "ok"}

@router.get("/settings", response_model=List[schemas.ExtractorSetting])
def read_settings(
    db: Session = Depends(deps.get_db),
    current_user = Depends(deps.get_current_extractor_user),
) -> Any:
    return db.query(ExtractorSetting).all()

@router.post("/settings", response_model=schemas.ExtractorSetting)
def save_setting(
    setting_in: schemas.ExtractorSettingCreate,
    db: Session = Depends(deps.get_db),
    current_user = Depends(deps.get_current_extractor_user),
) -> Any:
    setting = db.query(ExtractorSetting).filter(ExtractorSetting.key == setting_in.key).first()
    if setting:
        setting.value = setting_in.value
    else:
        setting = ExtractorSetting(**setting_in.model_dump())
    
    db.add(setting)
    db.commit()
    db.refresh(setting)
    return setting

@router.get("/documents/{doc_id}/file")
def serve_document_file(
    doc_id: int,
    db: Session = Depends(deps.get_db),
    token: Optional[str] = Query(None),
    authorization: Optional[str] = Header(None),
) -> Any:
    """Serve the original document file. Supports both Bearer token in header and token in Query."""
    from jose import jwt as jose_jwt, JWTError
    from pydantic import ValidationError
    from app.core import security as core_security
    from app.schemas.token import TokenPayload as TP
    from app.models.user import User as UserModel
    
    final_token = token
    if not final_token and authorization:
        scheme, param = authorization.split() if " " in authorization else (None, None)
        if scheme.lower() == "bearer":
            final_token = param

    if not final_token:
        raise HTTPException(status_code=401, detail="Authentication required")

    try:
        payload = jose_jwt.decode(final_token, settings.SECRET_KEY, algorithms=[core_security.ALGORITHM])
        token_data = TP(**payload)
    except (JWTError, ValidationError):
        raise HTTPException(status_code=401, detail="Invalid token")

    user = db.query(UserModel).filter(UserModel.id == token_data.sub).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
        
    # Check extractor access
    if not user.has_extractor_access and not user.is_superuser:
        raise HTTPException(status_code=403, detail="User does not have access to the Extractor module")

    doc = db.query(ExtractedDocument).filter(ExtractedDocument.id == doc_id).first()
    if not doc or not os.path.exists(doc.file_path):
        raise HTTPException(status_code=404, detail="File not found")
    
    from fastapi.responses import FileResponse
    return FileResponse(doc.file_path)

@router.post("/documents/{doc_id}/reprocess")
async def reprocess_document(
    doc_id: int,
    background_tasks: BackgroundTasks,
    db: Session = Depends(deps.get_db),
    current_user = Depends(deps.get_current_extractor_user),
) -> Any:
    """Trigger a new extraction process for an existing document."""
    doc = db.query(ExtractedDocument).filter(ExtractedDocument.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Check project ownership
    project = db.query(ExtractorProject).filter(ExtractorProject.id == doc.project_id, ExtractorProject.owner_id == current_user.id).first()
    if not project:
        raise HTTPException(status_code=403, detail="Not authorized to reprocess this document")

    # Clear previous values
    db.query(DocumentFieldValue).filter(DocumentFieldValue.document_id == doc_id).delete()
    db.query(ExtractionAlert).filter(ExtractionAlert.document_id == doc_id).delete()
    
    doc.status = "pending"
    doc.error_message = None
    db.commit()
    
    # Enqueue processing
    background_tasks.add_task(process_document_task, deps.SessionLocal, doc.id, doc.project_id)
    
    return {"message": "Document reprocessing started"}
@router.post("/projects/{id}/reprocess")
async def reprocess_project_documents(
    id: int,
    background_tasks: BackgroundTasks,
    db: Session = Depends(deps.get_db),
    current_user = Depends(deps.get_current_extractor_user),
) -> Any:
    """Trigger a new extraction process for ALL documents in a project."""
    project = db.query(ExtractorProject).filter(ExtractorProject.id == id, ExtractorProject.owner_id == current_user.id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    docs = db.query(ExtractedDocument).filter(ExtractedDocument.project_id == id).all()
    
    for doc in docs:
        # Clear previous values
        db.query(DocumentFieldValue).filter(DocumentFieldValue.document_id == doc.id).delete()
        db.query(ExtractionAlert).filter(ExtractionAlert.document_id == doc.id).delete()
        
        doc.status = "pending"
        doc.error_message = None
        db.add(doc)
    
    db.commit()
    
    # Enqueue processing for each
    for doc in docs:
        background_tasks.add_task(process_document_task, deps.SessionLocal, doc.id, id)
    
    return {"message": f"Reprocessing started for {len(docs)} documents"}
@router.delete("/documents/{doc_id}")
def delete_extracted_document(
    doc_id: int,
    db: Session = Depends(deps.get_db),
    current_user = Depends(deps.get_current_extractor_user),
) -> Any:
    """Delete an individual extracted document and its related data."""
    doc = db.query(ExtractedDocument).filter(ExtractedDocument.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Check ownership
    project = db.query(ExtractorProject).filter(ExtractorProject.id == doc.project_id, ExtractorProject.owner_id == current_user.id).first()
    if not project and not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Not authorized to delete this document")

    # Delete related file from disk if it's in the uploads directory
    if doc.file_path and "uploads" in doc.file_path:
        try:
            if os.path.exists(doc.file_path):
                os.remove(doc.file_path)
        except Exception as e:
            logger.warning(f"Could not delete physical file {doc.file_path}: {e}")

    # Related DocumentFieldValue and ExtractionAlert will be deleted via CASCADE
    db.delete(doc)
    db.commit()
    
    return {"message": "Document deleted successfully"}
