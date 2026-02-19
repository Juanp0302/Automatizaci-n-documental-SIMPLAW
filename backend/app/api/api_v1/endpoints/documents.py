from typing import Any, List
import logging

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse, Response
from sqlalchemy.orm import Session
import os

from app import crud, models, schemas
from app.api import deps
from app.core.config import settings

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/", response_model=List[schemas.Document])
def read_documents(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    search: str = None,
    start_date: str = None, # Using str to allow flexibility, or datetime if validated
    end_date: str = None,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    logger.info(f"read_documents called by user {current_user.id}")
    
    # Parse dates if provided
    start_dt = None
    end_dt = None
    from datetime import datetime
    
    try:
        if start_date:
            # Handle 'Z' which fromisoformat doesn't like in older python versions, 
            # though usually it's fine in 3.11. frontend sends .toISOString()
            start_dt = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
        if end_date:
            end_dt = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
    except Exception as parse_error:
        logger.warning(f"Date parsing error: {parse_error}")
        # If parsing fails, ignore dates or let it fail? Let's ignore to avoid 500
        pass

    try:
        if current_user.is_superuser:
            documents = crud.document.get_multi_filtered(
                db, 
                skip=skip, 
                limit=limit,
                search=search,
                start_date=start_dt,
                end_date=end_dt
            )
            # logger.debug(f"superuser calling get_multi_filtered, found {len(documents)} docs")
        else:
            documents = crud.document.get_multi_by_owner(
                db=db,
                owner_id=current_user.id,
                skip=skip,
                limit=limit,
                search=search,
                start_date=start_dt,
                end_date=end_dt
            )
            # logger.debug(f"user calling get_multi_by_owner, found {len(documents)} docs")
        return documents
    except Exception as e:
        import traceback
        import os
        error_msg = traceback.format_exc()
        try:
            # Force absolute path
            error_path = r"C:\Users\Usuario\Documents\Proyectos AUT\Automatización Documental\backend\REAL_ERROR.txt"
            with open(error_path, "w", encoding="utf-8") as f:
                f.write(f"Error in read_documents:\n{error_msg}\n\nException: {str(e)}")
        except Exception as file_err:
            print(f"Failed to write error log: {file_err}")
            
        traceback.print_exc()
        # Return the actual error details to frontend for debugging (even if frontend alerts generic message, debugging tools might see it if I could use them, but file is better)
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")


@router.post("/", response_model=schemas.Document)
def create_document(
    *,
    db: Session = Depends(deps.get_db),
    document_in: schemas.DocumentCreate,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Create new document (Trigger generation).
    """
    # Verify template exists
    template = crud.template.get(db, id=document_in.template_id)
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")

    # Verify template file exists on disk
    if not os.path.exists(template.file_path):
         raise HTTPException(status_code=404, detail="Template file not found on disk")

    # Generate output directory (absolute path)
    output_dir = settings.GENERATED_DOCS_DIR
    
    # Generate filename
    safe_title = "".join([c for c in document_in.title if c.isalnum() or c in (' ', '-', '_')]).strip()
    
    # Versioning Logic
    version = 1
    if document_in.parent_id:
        parent_doc = crud.document.get(db, id=document_in.parent_id)
        if not parent_doc:
             raise HTTPException(status_code=404, detail="Parent document not found")
        
        # Calculate new version
        version = parent_doc.version + 1
        
        # Append version to filename
        safe_title = f"{safe_title}_v{version}"
        
    filename = f"{current_user.id}_{document_in.template_id}_{safe_title}.docx"
    file_path = os.path.join(output_dir, filename)
    
    try:
        from docxtpl import DocxTemplate
        
        # Load template with docxtpl
        doc = DocxTemplate(template.file_path)
        
        # Context setup
        context = document_in.variables or {}
        
        # Add basic metadata if not present
        if "title" not in context:
            context["title"] = document_in.title
        if "date" not in context:
             from datetime import datetime, timezone, timedelta
             bogota_tz = timezone(timedelta(hours=-5))
             context["date"] = datetime.now(bogota_tz).strftime("%Y-%m-%d")
        
        # Render the template (Preserves formatting!)
        doc.render(context)

        doc.save(file_path)
        
    except Exception as e:
        logger.error(f"Error generating document: {e}")
        raise HTTPException(status_code=500, detail=f"Error generating document: {str(e)}")

    
    db_obj = models.Document(
        title=document_in.title,
        template_id=document_in.template_id,
        user_id=current_user.id,
        generated_file_path=file_path,
        version=version,
        parent_id=document_in.parent_id
    )
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    
    return db_obj




def convert_to_pdf(docx_path: str, pdf_path: str):
    """
    Convert a docx file to pdf using docx2pdf.
    Requires Microsoft Word to be installed.
    """
    try:
        import pythoncom
        pythoncom.CoInitialize()
        from docx2pdf import convert
        convert(docx_path, pdf_path)
    except ImportError:
        logger.error("docx2pdf module not found.")
        raise HTTPException(status_code=500, detail="PDF conversion service not available (module missing)")
    except Exception as e:
        logger.error(f"Error converting to PDF: {e}")
        # Check if it might be due to missing Word
        if "Word" in str(e) or "COM" in str(e):
             raise HTTPException(status_code=500, detail="PDF conversion failed: Microsoft Word may not be installed or accessible.")
        raise HTTPException(status_code=500, detail=f"PDF conversion failed: {str(e)}")
    finally:
        try:
            pythoncom.CoUninitialize()
        except:
            pass


@router.get("/{id}/download")
def download_document(
    *,
    db: Session = Depends(deps.get_db),
    id: int,
    format: str = "docx",  # Added format parameter
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Download a document file.
    Format can be "docx" (default) or "pdf".
    """
    document = crud.document.get(db, id=id)
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
        
    if not current_user.is_superuser and (document.user_id != current_user.id):
        raise HTTPException(status_code=400, detail="Not enough permissions")
        
    # Resolve file path - try absolute first, then relative to BASE_DIR
    file_path = document.generated_file_path
    logger.info(f"Download request for doc {id}, format={format}, stored path: {repr(file_path)}")
    logger.info(f"Download request for doc {id}, format={format}")
    
    if not os.path.isabs(file_path):
        file_path = os.path.join(settings.BASE_DIR, file_path)
    
    logger.info(f"Resolved file path: {repr(file_path)}")
    
    if not os.path.exists(file_path):
        logger.error(f"File not found: {file_path}")
        raise HTTPException(status_code=404, detail="File not found on disk")
        
    # Handle PDF format
    if format.lower() == "pdf":
        pdf_path = file_path.replace(".docx", ".pdf")
        
        # Check if PDF already exists (simple caching)
        if not os.path.exists(pdf_path):
            logger.info(f"Converting {file_path} to PDF...")
            # We need to ensure the path is absolute for COM interop usually
            abs_docx_path = os.path.abspath(file_path)
            abs_pdf_path = os.path.abspath(pdf_path)
            
            convert_to_pdf(abs_docx_path, abs_pdf_path)
            
            if not os.path.exists(abs_pdf_path):
                 raise HTTPException(status_code=500, detail="PDF file was not created after conversion attempt.")
                 
            logger.info(f"PDF created at {abs_pdf_path}")
            
        # Serve the PDF
        file_path = pdf_path
        media_type = 'application/pdf'
    else:
        media_type = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'

    try:
        # Read file into memory
        with open(file_path, "rb") as f:
            file_content = f.read()
        
        filename = os.path.basename(file_path)
        logger.info(f"Serving file: {filename} ({len(file_content)} bytes)")
        
        return Response(
            content=file_content,
            media_type=media_type,
            headers={
                'Content-Disposition': f'attachment; filename="{filename}"',
                'Content-Length': str(len(file_content))
            }
        )
    except Exception as e:
        logger.error(f"Error reading file {file_path}: {e}")
        import traceback
        error_msg = traceback.format_exc()
        try:
            # Force absolute path
            error_path = r"C:\Users\Usuario\Documents\Proyectos AUT\Automatización Documental\backend\DOWNLOAD_ERROR.txt"
            with open(error_path, "w", encoding="utf-8") as f:
                f.write(f"Error in download_document:\n{error_msg}\n\nException: {str(e)}")
        except Exception as file_err:
            print(f"Failed to write error log: {file_err}")
            
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error reading file: {str(e)}")


@router.post("/preview")
def preview_document(
    *,
    db: Session = Depends(deps.get_db),
    document_in: schemas.DocumentCreate,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Generate a preview of the document (PDF) without saving it to the database.
    """
    # Verify template exists
    template = crud.template.get(db, id=document_in.template_id)
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")

    # Verify template file exists on disk
    if not os.path.exists(template.file_path):
         raise HTTPException(status_code=404, detail="Template file not found on disk")

    import tempfile
    
    try:
        from docxtpl import DocxTemplate
        
        # Load template with docxtpl
        doc = DocxTemplate(template.file_path)
        
        # Context setup
        context = document_in.variables or {}
        
        # Add basic metadata if not present
        if "title" not in context:
            context["title"] = document_in.title
        if "date" not in context:
             from datetime import datetime, timezone, timedelta
             bogota_tz = timezone(timedelta(hours=-5))
             context["date"] = datetime.now(bogota_tz).strftime("%Y-%m-%d")
        
        # Render the template
        doc.render(context)
        
        # Create temporary paths
        import uuid
        unique_id = str(uuid.uuid4())
        
        # Use centralized TEMP_DIR
        tmp_docx_name = f"preview_{unique_id}.docx"
        tmp_pdf_name = f"preview_{unique_id}.pdf"
        
        tmp_docx_path = os.path.join(settings.TEMP_DIR, tmp_docx_name)
        tmp_pdf_path = os.path.join(settings.TEMP_DIR, tmp_pdf_name)
        
        try:
            doc.save(tmp_docx_path)
            
            # Convert to PDF
            # Ensure paths are absolute for COM
            convert_to_pdf(os.path.abspath(tmp_docx_path), os.path.abspath(tmp_pdf_path))
            
            if not os.path.exists(tmp_pdf_path):
                raise Exception("PDF file was not created during preview generation.")
    
            # Read PDF content
            with open(tmp_pdf_path, "rb") as f:
                pdf_content = f.read()
                
            return Response(
                content=pdf_content,
                media_type='application/pdf',
                headers={
                    'Content-Disposition': 'inline; filename="preview.pdf"'
                }
            )

        finally:
            # Clean up temp files consistently
            try:
                if os.path.exists(tmp_docx_path): 
                    os.remove(tmp_docx_path)
                if os.path.exists(tmp_pdf_path):
                    os.remove(tmp_pdf_path)
            except Exception as cleanup_error:
                logger.warning(f"Failed to cleanup temp files: {cleanup_error}")
        
    except Exception as e:
        logger.error(f"Error generating preview: {e}")
        # Try to cleanup if error occurred
        try:
            if 'tmp_docx_path' in locals() and os.path.exists(tmp_docx_path):
                os.remove(tmp_docx_path)
            if 'tmp_pdf_path' in locals() and os.path.exists(tmp_pdf_path):
                os.remove(tmp_pdf_path)
        except:
            pass
            
        raise HTTPException(status_code=500, detail=f"Error generating preview: {str(e)}")


@router.delete("/{id}", response_model=schemas.Document)
def delete_document(
    *,
    db: Session = Depends(deps.get_db),
    id: int,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Delete a document.
    """
    document = crud.document.get(db, id=id)
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    if not current_user.is_superuser and (document.user_id != current_user.id):
        raise HTTPException(status_code=400, detail="Not enough permissions")

    # Delete file from disk
    file_path = document.generated_file_path
    if not os.path.isabs(file_path):
        file_path = os.path.join(settings.BASE_DIR, file_path)

    try:
        if os.path.exists(file_path):
            os.remove(file_path)
    except Exception as e:
        logger.warning(f"Could not delete file {file_path}: {e}")

    document = crud.document.remove(db, id=id)
    return document
