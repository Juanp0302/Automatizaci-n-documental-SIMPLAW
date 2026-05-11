
import pandas as pd
import io
import json
from typing import List
from sqlalchemy.orm import Session
from app import crud, models

def export_documents_to_excel(db: Session, document_ids: List[int], user_id: int, is_superuser: bool = False) -> io.BytesIO:
    """
    Exports a list of documents to an Excel file.
    Each row is a document, columns are variables.
    """
    data = []
    
    for doc_id in document_ids:
        document = crud.document.get(db, id=doc_id)
        if not document:
            continue
            
        # Permission check
        if not is_superuser and (document.user_id != user_id):
            continue
            
        row = {
            "ID": document.id,
            "Título": document.title,
            "Fecha Creación": document.created_at.strftime("%Y-%m-%d %H:%M") if document.created_at else "N/A"
        }
        
        # Flatten variables
        if document.variables:
            variables = document.variables
            if isinstance(variables, str):
                try:
                    variables = json.loads(variables)
                except:
                    variables = {}
            
            if isinstance(variables, dict):
                for key, value in variables.items():
                    # Clean key for excel column name if needed
                    row[key] = value
        
        data.append(row)
    
    if not data:
        # Create at least an empty dataframe with headers
        df = pd.DataFrame(columns=["ID", "Título", "Fecha Creación"])
    else:
        df = pd.DataFrame(data)
    
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        df.to_excel(writer, sheet_name="Documentos", index=False)
        
        # Auto-adjust columns width
        worksheet = writer.sheets['Documentos']
        for idx, col in enumerate(df.columns):
            max_len = max(
                df[col].astype(str).map(len).max(),
                len(str(col))
            ) + 2
            worksheet.column_dimensions[chr(65 + idx)].width = min(max_len, 50)

    output.seek(0)
    return output
