import pandas as pd
import io
import logging
import json
from typing import List
from sqlalchemy.orm import Session
from app.models.extractor import ExtractedDocument, DocumentFieldValue, DocType

logger = logging.getLogger(__name__)

def clean_sheet_name(name: str) -> str:
    """Removes invalid characters for Excel sheet names."""
    invalid = [':', '\\', '/', '?', '*', '[', ']']
    for char in invalid:
        name = name.replace(char, '')
    return name[:31]

def export_project_to_excel(db: Session, project_id: int, filter_status: str = "all") -> io.BytesIO:
    """
    Exports documents of a project to an Excel file.
    Each DocType gets its own sheet.
    """
    doc_types = db.query(DocType).filter(DocType.project_id == project_id).all()
    
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        has_sheets = False
        
        # 1. Summary sheet (always present to prevent empty workbook error)
        summary_data = [
            {"Atributo": "ID Proyecto", "Valor": project_id},
            {"Atributo": "Filtro Aplicado", "Valor": filter_status},
            {"Atributo": "Total Tipos Doc", "Valor": len(doc_types)}
        ]
        pd.DataFrame(summary_data).to_excel(writer, sheet_name="Resumen", index=False)
        has_sheets = True

        # 2. DocType sheets
        for dt in doc_types:
            query = db.query(ExtractedDocument).filter(
                ExtractedDocument.project_id == project_id,
                ExtractedDocument.doc_type_id == dt.id,
                ExtractedDocument.status == "completed"
            )
            
            if filter_status == "approved":
                query = query.filter(ExtractedDocument.review_status == "approved")
            
            docs = query.all()
            if not docs: continue
                
            data = []
            for doc in docs:
                row = {
                    "ID": doc.id,
                    "Archivo": doc.file_name,
                    "Fecha": doc.created_at.strftime("%Y-%m-%d %H:%M") if doc.created_at else "N/A",
                    "Estado": doc.review_status
                }
                field_values = db.query(DocumentFieldValue).filter(DocumentFieldValue.document_id == doc.id).all()
                for fv in field_values:
                    row[fv.field_label or fv.field_name] = fv.normalized_value or fv.raw_value
                data.append(row)
            
            if data:
                df = pd.DataFrame(data)
                sheet_name = clean_sheet_name(dt.name)
                df.to_excel(writer, sheet_name=sheet_name, index=False)
                has_sheets = True
                
    output.seek(0)
    return output

def export_project_to_csv(db: Session, project_id: int, filter_status: str = "all") -> io.BytesIO:
    query = db.query(ExtractedDocument).filter(ExtractedDocument.project_id == project_id, ExtractedDocument.status == "completed")
    if filter_status == "approved":
        query = query.filter(ExtractedDocument.review_status == "approved")
    
    docs = query.all()
    data = []
    for doc in docs:
        row = {"ID": doc.id, "Archivo": doc.file_name, "Tipo": doc.doc_type_id, "Estado": doc.review_status}
        field_values = db.query(DocumentFieldValue).filter(DocumentFieldValue.document_id == doc.id).all()
        for fv in field_values:
            row[fv.field_label or fv.field_name] = fv.normalized_value or fv.raw_value
        data.append(row)
    
    df = pd.DataFrame(data)
    output = io.BytesIO()
    df.to_csv(output, index=False, encoding='utf-8-sig')
    output.seek(0)
    return output

def export_project_to_json(db: Session, project_id: int, filter_status: str = "all") -> io.BytesIO:
    query = db.query(ExtractedDocument).filter(ExtractedDocument.project_id == project_id, ExtractedDocument.status == "completed")
    if filter_status == "approved":
        query = query.filter(ExtractedDocument.review_status == "approved")
    
    docs = query.all()
    data = []
    for doc in docs:
        doc_data = {
            "id": doc.id, "file_name": doc.file_name, "status": doc.status, "review_status": doc.review_status,
            "fields": {}
        }
        field_values = db.query(DocumentFieldValue).filter(DocumentFieldValue.document_id == doc.id).all()
        for fv in field_values:
            doc_data["fields"][fv.field_name] = fv.normalized_value or fv.raw_value
        data.append(doc_data)
    
    output = io.BytesIO()
    output.write(json.dumps(data, indent=4, ensure_ascii=False).encode('utf-8'))
    output.seek(0)
    return output
