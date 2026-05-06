import sqlite3
import datetime

def create_mock_data():
    conn = sqlite3.connect('sql_app.db')
    cursor = conn.cursor()
    
    # Check if project 1 exists
    cursor.execute("SELECT id FROM extractor_projects WHERE id = 1")
    if not cursor.fetchone():
        print("Project 1 not found. Create one first.")
        return

    # Check if we have doc types
    cursor.execute("SELECT id FROM doc_types WHERE project_id = 1")
    doc_types = cursor.fetchall()
    if not doc_types:
        # Create a mock doc type
        cursor.execute("INSERT INTO doc_types (project_id, name, color) VALUES (1, 'Factura de Venta', '#ef4444')")
        type_id = cursor.lastrowid
        
        # Create mock fields
        fields = [
            ('numero_factura', 'Número de Factura', 'text'),
            ('fecha_emision', 'Fecha de Emisión', 'date'),
            ('cliente_nombre', 'Nombre del Cliente', 'text'),
            ('total_factura', 'Total', 'number')
        ]
        for name, label, ftype in fields:
            cursor.execute("INSERT INTO doc_fields (doc_type_id, name, label, field_type) VALUES (?, ?, ?, ?)", (type_id, name, label, ftype))
    else:
        type_id = doc_types[0][0]

    # Create a mock document
    cursor.execute("""
        INSERT INTO extracted_documents 
        (project_id, file_name, file_ext, file_path, status, review_status, doc_type_id, classification_confidence, created_at)
        VALUES 
        (1, 'Factura_Muestra_01.pdf', '.pdf', 'c:/temp/mock.pdf', 'completed', 'pending', ?, 0.95, ?)
    """, (type_id, datetime.datetime.now()))
    
    doc_id = cursor.lastrowid
    
    # Create mock field values
    cursor.execute("SELECT id, name, label FROM doc_fields WHERE doc_type_id = ?", (type_id,))
    fields = cursor.fetchall()
    
    mock_values = {
        'numero_factura': 'FAC-2024-001',
        'fecha_emision': '2024-04-20',
        'cliente_nombre': 'Juan Pérez S.A.',
        'total_factura': '1,500.00'
    }
    
    for f_id, f_name, f_label in fields:
        val = mock_values.get(f_name, 'N/A')
        cursor.execute("""
            INSERT INTO document_field_values 
            (document_id, field_id, field_name, field_label, raw_value, normalized_value, confidence, source_text, is_manual)
            VALUES (?, ?, ?, ?, ?, ?, 0.92, ?, 0)
        """, (doc_id, f_id, f_name, f_label, val, val, f"Texto extraído para {f_label} en la esquina superior..."))

    conn.commit()
    conn.close()
    print(f"Mock document created with ID {doc_id}")

if __name__ == "__main__":
    create_mock_data()
